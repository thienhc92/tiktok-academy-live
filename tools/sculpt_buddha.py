"""Original reference-led Buddha surface study for Blender.

Coordinates: x / height / depth, facing +depth. Closed lofts replace the old
voxel-unioned primitives. Geometry is authored, not scanned from the reference.
quality=1 is the web mesh; quality=2 resamples the editable sculpt source.
"""
import math
from bisect import bisect_right
import bpy
from mathutils import Vector


def build_buddha(p, materials, finish, quality=1):
    skin, robe, hair, dark, lip = (materials[k] for k in ('skin', 'robe', 'hair', 'dark', 'lip'))
    created = []

    def surface(name, fn, nu, nv, material, wrap=False):
        nu, nv = int(nu * quality), int(nv * quality)
        vertices = [p(fn(i / nu, j / nv)) for j in range(nv + 1) for i in range(nu + 1)]
        faces = []
        for j in range(nv):
            for i in range(nu):
                a = j * (nu + 1) + i
                right = j*(nu+1)+((i+1)%nu if wrap else i+1)
                faces.append((a, right, right+nu+1, a+nu+1))
        mesh = bpy.data.meshes.new(name)
        mesh.from_pydata(vertices, [], faces)
        mesh.update()
        uv = mesh.uv_layers.new(name='Sculpt UV')
        for polygon in mesh.polygons:
            polygon.use_smooth = True
            i, j = polygon.index % nu, polygon.index // nu
            corners = [(i/nu,j/nv),((i+1)/nu,j/nv),((i+1)/nu,(j+1)/nv),(i/nu,(j+1)/nv)]
            for loop, coord in zip(polygon.loop_indices, corners):
                uv.data[loop].uv = coord
        obj = bpy.data.objects.new(name, mesh)
        bpy.context.collection.objects.link(obj)
        finish(obj, name, material)
        region = 'detail'
        lower = name.lower()
        if name == 'Continuous sculpted face': region = 'face'
        elif name == 'Anatomical chest neck': region = 'bust'
        elif any(k in lower for k in ['finger', 'thumb', 'hand palm', 'upturned palm']): region = 'hands'
        elif any(k in lower for k in ['drapery', 'draped', 'folded lap', 'robe stitched']): region = 'garment'
        elif any(k in lower for k in ['hair', 'curl', 'ushnisha']): region = 'hair'
        elif 'bare arm' in lower: region = 'arms'
        elif any(k in lower for k in ['foot', 'toe']): region = 'feet'
        obj['sculpt_region'] = region
        obj['sculpt_revision'] = 2
        obj['source_quality'] = quality
        created.append(obj)
        return obj

    def interpolate(points, t):
        """Catmull-Rom interpolation, bounded within each interval."""
        t = max(points[0][0], min(t, points[-1][0]))
        i = max(0, min(len(points) - 2, bisect_right([q[0] for q in points], t) - 1))
        v = (t - points[i][0]) / (points[i + 1][0] - points[i][0])
        values = []
        for c in range(1, len(points[0])):
            a, b, cc, d = (points[max(0, min(len(points) - 1, k))][c] for k in [i - 1, i, i + 1, i + 2])
            value = .5 * (2*b + (-a+cc)*v + (2*a-5*b+4*cc-d)*v*v + (-a+3*b-3*cc+d)*v*v*v)
            values.append(max(min(b, cc), min(max(b, cc), value)))
        return values

    def ellipsoid(name, center, radii, material, nu=40, nv=26):
        def point(u, v):
            phi = math.pi * (.0001 + .9998*v)
            a = math.tau*u
            return (center[0]+radii[0]*math.sin(phi)*math.sin(a),
                    center[1]-radii[1]*math.cos(phi),
                    center[2]+radii[2]*math.sin(phi)*math.cos(a))
        return surface(name, point, nu, nv, material, wrap=True)

    def sweep(name, nodes, material, rings=16, steps=40, flatten=1, fold=0):
        # nodes: progression, x, height, depth, radius.
        def point(u, v):
            center = Vector(interpolate(nodes, v)[:3])
            radius = interpolate(nodes, v)[3]
            a = Vector(interpolate(nodes, min(1, v+.0005))[:3])
            b = Vector(interpolate(nodes, max(0, v-.0005))[:3])
            tangent = (a-b).normalized()
            normal = Vector((0, 0, 1))
            normal = (normal-tangent*normal.dot(tangent)).normalized()
            if normal.length < .1:
                normal = Vector((0, 1, 0))
            binormal = tangent.cross(normal).normalized()
            theta = u*math.tau
            ripple = fold * math.sin(theta*11+v*5) * math.sin(math.pi*v)
            offset = normal*(math.cos(theta)*(radius+ripple)*flatten)+binormal*(math.sin(theta)*(radius+ripple))
            return tuple(center+offset)
        return surface(name, point, rings, steps, material, wrap=True)

    # Broad chest blends into a short, flared anatomical neck, without a cylinder.
    bust = [(2.9,.72,.42), (3.15,.84,.50), (3.55,.88,.53), (3.95,.99,.57),
            (4.28,1.10,.53), (4.48,1.12,.46), (4.64,.99,.39), (4.78,.73,.34),
            (4.90,.44,.30), (5.02,.35,.29), (5.16,.36,.30), (5.27,.40,.30)]
    def bust_front(x, y):
        rx, rz = interpolate(bust, y)
        z = -2.92+rz*math.sqrt(max(.04, 1-(x/rx)**2))
        # Clavicles and sternum: broad, subtle relief, not separate hard objects.
        z += .025*math.exp(-((y-4.62)/.09)**2)*math.cos(x*2.4)
        return z
    def bust_surface(u, v):
        y = 2.9+v*2.37
        rx, rz = interpolate(bust, y)
        a = u*math.tau
        x = rx*math.sin(a)
        z = -2.92+rz*math.cos(a)
        if math.cos(a)>0:
            z += (bust_front(x, y)-(-2.92+rz*math.sqrt(max(.04,1-(x/rx)**2))))*math.cos(a)**2
        return x, y, z
    surface('Anatomical chest neck', bust_surface, 96, 100, skin, wrap=True)

    # A single closed head; all front relief is part of the head surface.
    head = [(5.12,.035,.055), (5.20,.28,.29), (5.34,.45,.40), (5.55,.57,.46),
            (5.80,.62,.49), (6.02,.615,.47), (6.20,.57,.43), (6.38,.46,.34),
            (6.50,.25,.21), (6.54,.006,.01)]
    def face_z(x, y):
        rx, rz = interpolate(head, y)
        z = -2.88+rz*math.sqrt(max(.002,1-(x/max(.01,rx))**2))
        def g(cx, cy, sx, sy): return math.exp(-((x-cx)/sx)**2-((y-cy)/sy)**2)
        z += .115*g(0,5.83,.080,.28)+.135*g(0,5.70,.102,.080)
        z += .034*(g(-.10,5.69,.060,.045)+g(.10,5.69,.060,.045))
        z += .040*(g(-.32,5.68,.17,.16)+g(.32,5.68,.17,.16))
        z -= .040*(g(-.245,5.985,.15,.073)+g(.245,5.985,.15,.073))
        z += .032*(g(-.25,6.075,.18,.052)+g(.25,6.075,.18,.052))
        z += .032*(g(-.07,5.495,.082,.031)+g(.07,5.495,.082,.031))
        z += .047*g(0,5.445,.142,.030)+.035*g(0,5.29,.22,.08)
        z -= .014*g(0,5.39,.18,.025)
        return z
    def head_surface(u, v):
        y = 5.12+v*1.42
        rx, rz = interpolate(head, y)
        a = u*math.tau
        x = rx*math.sin(a)
        z = -2.88+rz*math.cos(a)
        if math.cos(a)>0:
            base = -2.88+rz*math.sqrt(max(.002,1-(x/max(.01,rx))**2))
            z += (face_z(x,y)-base)*math.cos(a)**3
        return x, y, z
    surface('Continuous sculpted face', head_surface, 144, 112, skin, wrap=True)

    def facial_line(name, points, radius, material):
        nodes=[]
        for i,(x,y) in enumerate(points):
            nodes.append((i/(len(points)-1),x,y,face_z(x,y)+.008,radius*(.35+.65*math.sin(math.pi*i/(len(points)-1)))))
        return sweep(name,nodes,material,8,26)
    for side in [-1,1]:
        facial_line('Tapered eyebrow',[(side*.09,6.075),(side*.19,6.115),(side*.30,6.11),(side*.40,6.06)],.013,hair)
        facial_line('Upper eyelid',[(side*.10,5.984),(side*.22,6.006),(side*.32,5.997),(side*.39,5.968)],.012,skin)
        facial_line('Half closed eye',[(side*.115,5.975),(side*.22,5.965),(side*.32,5.965),(side*.38,5.969)],.006,dark)
        def eye_slit(u,v,side=side):
            x=side*(.115+.255*u)
            y=5.973+.005*math.sin(math.pi*u)-.017*math.sin(math.pi*u)*v
            return x,y,face_z(x,y)+.010
        # Mirroring reverses the winding, so keep this very thin patch double-sided.
        surface('Half open eye slit',eye_slit,24,6,dark)
        facial_line('Lower eyelid',[(side*.13,5.957),(side*.24,5.946),(side*.35,5.953)],.009,skin)
        ellipsoid('Nostril inset',(side*.075,5.675,face_z(side*.075,5.675)+.003),(.022,.010,.008),dark,16,10)
        ear=ellipsoid('Long earlobe',(side*.61,5.70,-2.88),(.115,.34,.105),skin,32,36)
        sweep('Ear inner ridge',[(0,side*.66,5.95,-2.79,.012),(.3,side*.69,5.85,-2.76,.022),(.7,side*.65,5.55,-2.77,.017),(1,side*.61,5.43,-2.80,.008)],skin,10,28)
    facial_line('Mouth crease',[(-.17,5.475),(-.08,5.477),(0,5.470),(.08,5.477),(.17,5.475)],.005,lip)
    ellipsoid('Urna',(0,6.16,face_z(0,6.16)+.006),(.022,.025,.012),skin,20,16)
    # Shallow anatomical neck creases follow the curved surface.
    for y in [4.98,5.065,5.145]:
        rx,rz=interpolate(bust,y)
        nodes=[]
        for i in range(9):
            a=-1.1+i*2.2/8
            nodes.append((i/8,rx*math.sin(a),y-.009*math.cos(a),-2.92+rz*math.cos(a)+.002,.006))
        sweep('Neck crease',nodes,robe,6,24)

    # Fine hair coils, smaller than the previous bead-like cap.
    ellipsoid('Sculpted hair cap',(0,6.30,-2.91),(.60,.32,.46),hair,64,40)
    for row in range(12):
        phi=.18+row*.157
        count=max(10,int(46*math.sin(phi)))
        for i in range(count):
            a=math.tau*(i+.5*(row%2))/count
            x=.596*math.sin(phi)*math.sin(a)
            y=6.30+.325*math.cos(phi)
            z=-2.91+.457*math.sin(phi)*math.cos(a)
            ellipsoid('Small hair coil',(x,y,z),(.039,.037,.039),hair,8,4)
    ellipsoid('Ushnisha',(0,6.68,-2.92),(.16,.20,.155),hair,32,24)
    for row in range(4):
        for i in range(12):
            a=i*math.tau/12+row*.2
            ellipsoid('Crown curl',(.15*math.sin(a),6.58+row*.055,-2.92+.15*math.cos(a)),(.029,.028,.029),hair,8,4)

    # Soft seated volume, with integrated curved fabric relief across the lap.
    # Sculpt the crossed-leg volumes together; retain knee lobes and two curved shins.
    # This local union is restricted to the lap, never the face, hands or robe.
    pieces=[
        ellipsoid('Left draped knee',(-1.05,2.58,-2.75),(1.24,.60,.84),robe,48,32),
        ellipsoid('Right draped knee',(1.05,2.58,-2.75),(1.24,.60,.84),robe,48,32),
        sweep('Crossed shin one',[(0,1.85,2.73,-2.8,.25),(.35,.9,2.62,-2.05,.32),(.72,-.4,2.45,-1.82,.30),(1,-1.6,2.54,-2.25,.20)],robe,24,48),
        sweep('Crossed shin two',[(0,-1.82,2.7,-2.7,.25),(.35,-.9,2.45,-2.0,.27),(.72,.65,2.65,-2.05,.29),(1,1.5,2.82,-2.5,.20)],robe,24,48),
    ]
    bpy.ops.object.select_all(action='DESELECT')
    for piece in pieces:
        piece.select_set(True)
        created.remove(piece)
    bpy.context.view_layer.objects.active=pieces[0]
    bpy.ops.object.join()
    lap_obj=bpy.context.object
    remesh=lap_obj.modifiers.new('Local seated-leg sculpt union','REMESH')
    remesh.mode='VOXEL';remesh.voxel_size=.018 if quality==1 else .010;remesh.use_smooth_shade=True
    bpy.ops.object.modifier_apply(modifier=remesh.name)
    smooth=lap_obj.modifiers.new('Soft textile transitions','SMOOTH');smooth.factor=.55;smooth.iterations=6
    bpy.ops.object.modifier_apply(modifier=smooth.name)
    lap_obj.data.calc_loop_triangles()
    budget=30000 if quality==1 else 140000
    dec=lap_obj.modifiers.new('Seated-leg web retopology budget','DECIMATE')
    dec.ratio=min(1,budget/max(1,len(lap_obj.data.loop_triangles)));dec.use_collapse_triangulate=True
    bpy.ops.object.modifier_apply(modifier=dec.name)
    for vertex in lap_obj.data.vertices:
        x,y,z=vertex.co.x,vertex.co.z,-vertex.co.y
        front=max(0,min(1,(z+2.7)/.8))
        fold=(.018*math.sin(y*32+2*x+x*x*.4)+.012*math.sin(y*49-x*3))*front
        vertex.co.y-=fold
    lap_obj.data.materials.clear();lap_obj.data.materials.append(robe)
    uv=lap_obj.data.uv_layers.new(name='Lap sculpt UV')
    for polygon in lap_obj.data.polygons:
        polygon.use_smooth=True;polygon.material_index=0
        for loop in polygon.loop_indices:
            co=lap_obj.data.vertices[lap_obj.data.loops[loop].vertex_index].co
            uv.data[loop].uv=((math.atan2(co.x,-co.y+2.8)/math.tau)%1,(co.z-1.9)/1.6)
    lap_obj.name=('SCULPT' if quality==1 else 'MASTER')+'__Continuous crossed legs'
    lap_obj['sculpt_region']='garment';lap_obj['sculpt_revision']=2;lap_obj['source_quality']=quality
    lap_obj.data.update();created.append(lap_obj)
    # Crossed foot rests on the opposite thigh, with softly separated toes.
    sweep('Folded left foot',[(0,1.36,2.76,-2.85,.12),(.35,.98,2.98,-2.29,.16),(.75,.58,2.96,-2.16,.12),(1,.34,2.95,-2.10,.055)],skin,24,44,flatten=.7)
    for i in range(5):
        ellipsoid('Seated toe',(.34+i*.062,2.965,-2.08+i*.008),(.048,.055,.075),skin,16,12)

    # Arms taper continuously at elbow and wrist. Cloth hides the shoulder joins.
    sweep('Right bare arm',[(0,-.65,4.47,-2.95,.17),(.15,-.98,4.40,-2.87,.25),(.4,-1.30,3.93,-2.65,.235),(.65,-1.40,3.54,-2.25,.18),(1,-1.48,3.12,-1.98,.135)],skin,28,60)
    sweep('Left bare arm',[(0,.65,4.45,-2.96,.18),(.15,1.02,4.30,-2.85,.245),(.35,1.24,3.78,-2.69,.21),(.62,1.12,3.35,-2.20,.17),(1,.42,3.13,-1.95,.12)],skin,28,60)
    ellipsoid('Right hand palm',(-1.48,2.99,-1.96),(.175,.24,.092),skin,36,32)
    for i,length in enumerate([.24,.29,.30,.235]):
        x=-1.61+i*.085
        sweep('Right articulated finger',[(0,x,2.94,-1.89,.041),(.4,x-.008,2.94-length*.42,-1.865,.039),(.8,x-.003,2.94-length*.85,-1.89,.031),(1,x+.008,2.94-length,-1.92,.006)],skin,12,24)
        ellipsoid('Right fingernail',(x,2.96-length,-1.884),(.023,.041,.007),robe,16,12)
    sweep('Right thumb',[(0,-1.33,3.08,-1.94,.06),(.45,-1.25,2.98,-1.86,.052),(1,-1.29,2.87,-1.85,.007)],skin,14,26)
    ellipsoid('Left upturned palm',(.21,3.13,-1.94),(.28,.075,.16),skin,40,28)
    for i,length in enumerate([.22,.27,.27,.21]):
        z=-2.045+i*.072
        sweep('Left articulated finger',[(0,.10,3.14,z,.038),(.5,.10-length*.55,3.16,z+.012,.033),(1,.10-length,3.20,z+.02,.006)],skin,12,24)
    sweep('Left thumb',[(0,.33,3.16,-1.81,.052),(.5,.15,3.24,-1.76,.045),(1,-.01,3.23,-1.80,.007)],skin,14,26)

    # A UV-mapped garment lies on the anatomical chest instead of floating straps.
    def cloth(u,v):
        x=(2*u-1)*(.82+.10*math.sin(math.pi*v))
        top=4.06+.58*u+.11*math.sin(math.pi*u)
        y=2.97+(top-2.97)*v
        broad=.034*math.sin(u*30+v*4)+.014*math.sin(u*58+v*3)+.010*(1-u)*math.sin(v*18-u*5)
        z=bust_front(x,y)+.098+broad*(.35+.65*math.sin(math.pi*v)**.6)
        return x,y,z
    garment=surface('Sanghati continuous drapery',cloth,104,96,robe)
    solid=garment.modifiers.new('Thin cloth edge','SOLIDIFY');solid.thickness=.018
    solid.use_rim_only=(quality==1)
    # Robed shoulder is smooth and conforms to the arm, with longitudinal folds.
    sweep('Draped left shoulder',[(0,.46,4.67,-2.97,.22),(.25,.98,4.43,-2.87,.31),(.60,1.18,4.0,-2.75,.28),(1,1.24,3.60,-2.49,.235)],robe,40,64,flatten=1.05,fold=.018)
    # Thin cloth hem, following the actual upper surface exactly.
    nodes=[]
    for i in range(21):
        x,y,z=cloth(i/20,1)
        nodes.append((i/20,x,y,z+.007,.013))
    sweep('Robe stitched edge',nodes,robe,8,60)
    return created
