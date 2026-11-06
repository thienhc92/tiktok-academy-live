"""Original procedural sanctuary, Blender 4.3+. No external models or paid assets.
Run: blender -b --factory-startup --python tools/build_shrine.py -- --output public/temple3d/sanctuary.glb
Coordinates in this script are Three-style (x, height, depth); p() converts to Blender.
"""
import bpy, math, random, argparse, sys, os
from mathutils import Vector, Matrix
from collections import defaultdict
args=argparse.ArgumentParser();args.add_argument('--output',default='public/temple3d/sanctuary.glb');args.add_argument('--blend',default='')
opts=args.parse_args(sys.argv[sys.argv.index('--')+1:] if '--' in sys.argv else [])
bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
random.seed(51)
CATEGORY='ARCH'
def p(v):return Vector((v[0],-v[2],v[1]))
def material(name,color,metal=0,rough=.5,emission=0):
 m=bpy.data.materials.new(name);m.use_nodes=True;n=m.node_tree.nodes.get('Principled BSDF');n.inputs['Base Color'].default_value=(*color,1);n.inputs['Metallic'].default_value=metal;n.inputs['Roughness'].default_value=rough
 if emission:n.inputs['Emission Color'].default_value=(*color,1);n.inputs['Emission Strength'].default_value=emission
 return m
GOLD=material('Polished gold',(.83,.49,.13),.84,.34)
SKIN=material('Gold statue skin',(.88,.55,.19),.76,.34)
DARKGOLD=material('Antique carved gold',(.43,.24,.065),.8,.34)
EDGE=material('Gold highlights',(.96,.67,.25),.81,.32)
HAIR=material('Bronze hair',(.11,.067,.022),.73,.34)
EYE=material('Deep bronze details',(.12,.068,.019),.65,.4)
LIP=material('Copper lips',(.40,.16,.055),.72,.35)
WOOD=material('Lacquered teak',(.19,.055,.018),.05,.44)
STONE=material('Carved column bases',(.11,.12,.115),.32,.38)
FLOOR=material('Floor stone',(.28,.25,.20),.24,.27)
WHITE=material('Porcelain ivory',(.76,.77,.72),.08,.2)
BLUE=material('Cobalt porcelain details',(.035,.09,.19),.2,.26)
PINK=material('Lotus pink',(.66,.21,.30),.04,.38)
PALE=material('Lotus tips',(.93,.56,.57),.02,.4)
LEAF=material('Lotus foliage',(.075,.19,.04),.04,.52)
AMBER=material('Lantern light',(.98,.39,.055),.05,.25,2.2)
RUG=material('Woven ochre carpet',(.28,.12,.035),0,.93)
FRUIT=material('Tangerine offerings',(.94,.32,.018),.02,.46)
# Embedded wood-grain texture, deterministic and generated locally.
image=bpy.data.images.new('Local teak grain',width=128,height=512)
pixels=[]
for y in range(512):
 for x in range(128):
  grain=.55*math.sin(x*1.8+math.sin(y*.017)*2.3+math.sin(x*.07+y*.009)*3)+.30*math.sin(x*2.7+y*.004)
  fine=random.random()*.10;v=.72+.08*grain+fine*.5
  pixels.extend((.32*v,.105*v,.037*v,1))
image.pixels.foreach_set(pixels);image.pack()
tex=WOOD.node_tree.nodes.new('ShaderNodeTexImage');tex.image=image;WOOD.node_tree.links.new(tex.outputs['Color'],WOOD.node_tree.nodes.get('Principled BSDF').inputs['Base Color'])
HALO=material('Engraved mandorla gold',(.64,.37,.095),.82,.40)
W=256
height=[]
for yy in range(W):
 for xx in range(W):
  x=(xx-W/2)/(W/2);y=(yy-W/2)/(W/2);r=math.sqrt(x*x+y*y);a=math.atan2(y,x)
  f=math.sin(a*20+math.sin(r*25)*1.3)*math.sin(r*44+math.cos(a*12)*1.2)
  height.append(f*.5+.5)
norm=bpy.data.images.new('Original embossed gold normal',width=W,height=W);normalpixels=[]
for yy in range(W):
 for xx in range(W):
  dx=height[yy*W+min(W-1,xx+1)]-height[yy*W+max(0,xx-1)]
  dy=height[min(W-1,yy+1)*W+xx]-height[max(0,yy-1)*W+xx]
  n=Vector((-dx*.7,-dy*.7,1)).normalized();normalpixels.extend((n.x*.5+.5,n.y*.5+.5,n.z*.5+.5,1))
norm.pixels.foreach_set(normalpixels);norm.colorspace_settings.name='Non-Color';norm.pack()
tex=HALO.node_tree.nodes.new('ShaderNodeTexImage');tex.image=norm
node=HALO.node_tree.nodes.new('ShaderNodeNormalMap');node.inputs['Strength'].default_value=.45;HALO.node_tree.links.new(tex.outputs['Color'],node.inputs['Color']);HALO.node_tree.links.new(node.outputs['Normal'],HALO.node_tree.nodes.get('Principled BSDF').inputs['Normal'])
# All objects get an explicit category for efficient joins and inspection.
def finish(obj,name,mat):
 obj.name=CATEGORY+'__'+name;obj.data.materials.append(mat)
 if hasattr(obj.data,'polygons'):
  for face in obj.data.polygons:face.use_smooth=True
 return obj
CACHE={}
def sphere(name,loc,scale,mat,detail=16):
 key=('sphere',detail)
 if key not in CACHE:
  bpy.ops.mesh.primitive_uv_sphere_add(segments=detail,ring_count=max(6,detail//2));temp=bpy.context.object;CACHE[key]=temp.data;bpy.data.objects.remove(temp,do_unlink=True)
 obj=bpy.data.objects.new(name,CACHE[key].copy());bpy.context.collection.objects.link(obj);obj.location=p(loc);obj.scale=(scale[0],scale[2],scale[1]);return finish(obj,name,mat)
def box(name,loc,size,mat,bevel=0):
 bpy.ops.mesh.primitive_cube_add(size=1,location=p(loc));obj=bpy.context.object;obj.scale=(size[0],size[2],size[1]);bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
 if bevel:
  mod=obj.modifiers.new('Soft carved edges','BEVEL');mod.width=bevel;mod.segments=2
 return finish(obj,name,mat)
def cylinder(name,loc,radius,height,mat,vertices=24):
 bpy.ops.mesh.primitive_cylinder_add(vertices=vertices,radius=radius,depth=height,location=p(loc));return finish(bpy.context.object,name,mat)
def torus(name,loc,major,minor,mat,vertical=False):
 bpy.ops.mesh.primitive_torus_add(major_radius=major,minor_radius=minor,major_segments=48,minor_segments=8,location=p(loc));obj=bpy.context.object
 if vertical:obj.rotation_euler.x=math.pi/2
 return finish(obj,name,mat)
def line(name,points,radius,mat):
 curve=bpy.data.curves.new(name,'CURVE');curve.dimensions='3D';curve.resolution_u=5;curve.bevel_depth=radius;curve.bevel_resolution=2;curve.use_fill_caps=True
 spline=curve.splines.new('BEZIER');spline.bezier_points.add(len(points)-1)
 for bp,point in zip(spline.bezier_points,points):bp.co=p(point);bp.handle_left_type='AUTO';bp.handle_right_type='AUTO'
 obj=bpy.data.objects.new(name,curve);bpy.context.collection.objects.link(obj);return finish(obj,name,mat)
def beam(name,a,b,width,depth,mat):
 obj=box(name,((a[0]+b[0])/2,(a[1]+b[1])/2,(a[2]+b[2])/2),(width,math.dist(a,b),depth),mat,.015)
 obj.rotation_mode='QUATERNION';obj.rotation_quaternion=Vector((0,0,1)).rotation_difference(p(b)-p(a));return obj

def lathe(name,loc,profile,mat,segments=32):
 verts=[];faces=[]
 for radius,h in profile:
  for i in range(segments):
   angle=i*math.tau/segments;verts.append(p((loc[0]+radius*math.cos(angle),loc[1]+h,loc[2]+radius*math.sin(angle))))
 for row in range(len(profile)-1):
  for i in range(segments):
   j=(i+1)%segments;a=row*segments+i;b=row*segments+j;faces.append((a,a+segments,b+segments,b))
 mesh=bpy.data.meshes.new(name);mesh.from_pydata(verts,[],faces);mesh.update();obj=bpy.data.objects.new(name,mesh);bpy.context.collection.objects.link(obj);return finish(obj,name,mat)

def petal(name,loc,width,height,depth,angle,mat,lean=0):
 verts=[];faces=[];N=8;M=6
 for side in [0,1]:
  for j in range(N+1):
   v=j/N
   for i in range(M+1):
    u=i/M*2-1;w=width*math.sin(math.pi*v)**.72
    xx=u*w;yy=height*v;zz=depth*math.sin(v*math.pi*.7)+depth*.5*u*u*math.sin(math.pi*v)-side*.035+lean*yy
    # Sculpted vein down the center, not a flat polygon.
    zz+=.009*math.sin(v*40+abs(u)*7)*math.sin(math.pi*v)
    verts.append(p((loc[0]+xx*math.cos(angle)+zz*math.sin(angle),loc[1]+yy,loc[2]-xx*math.sin(angle)+zz*math.cos(angle))))
 stride=(N+1)*(M+1)
 for j in range(N):
  for i in range(M):
   a=j*(M+1)+i;faces.append((a,a+1,a+M+2,a+M+1));faces.append((a+stride,a+M+1+stride,a+M+2+stride,a+1+stride))
 for j in range(N):
  for i in [0,M]:
   a=j*(M+1)+i;b=(j+1)*(M+1)+i;faces.append((a,b,b+stride,a+stride))
 mesh=bpy.data.meshes.new(name);mesh.from_pydata(verts,[],faces);mesh.update();obj=bpy.data.objects.new(name,mesh);bpy.context.collection.objects.link(obj);return finish(obj,name,mat)

# Hall structure: real open sides and layered roof, no backdrop photograph.
for depth in [-5.1,-1.0,3.8,8.0]:
 for x in [-6.1,-3.65,3.65,6.1]:
  cylinder('Teak column',(x,4.35,depth),.255,7.55,WOOD)
  lathe('Carved stone column foot',(x,0,depth),[(.4,0),(.44,.1),(.44,.23),(.35,.30),(.37,.52),(.43,.62),(.4,.72),(.29,.82)],STONE)
  for h in [.13,.26,.58,.7]:torus('Column base moulding',(x,h,depth),.4,.035,DARKGOLD)
  for k in range(10):
   a=k*math.tau/10;petal('Stone foot foliage',(x+.36*math.sin(a),.27,depth+.36*math.cos(a)),.08,.29,.035,a,STONE)
  lathe('Column capital',(x,7.7,depth),[(.26,0),(.34,.08),(.37,.16),(.37,.23),(.29,.3)],WOOD)
for z in [-5.1,-1,3.8,8]:
 beam('Main crossbeam',(-6.5,7.8,z),(6.5,7.8,z),.40,.38,WOOD)
 for x in [-4.5,-2.5,0,2.5,4.5]:
  line('Carved beam scroll',[(x-.7,7.7,z+.22),(x-.4,7.47,z+.24),(x,7.6,z+.25),(x+.3,7.8,z+.22)],.04,DARKGOLD)
 for x in [-6.1,-3.65,3.65,6.1]:
  line('Bracket scroll',[(x,7.5,z),(x+(.65 if x<0 else -.65),7.35,z),(x+(.7 if x<0 else -.7),7.8,z)],.12,WOOD)
for x in [-6.1,-3.65,3.65,6.1]:beam('Long roof bearer',(x,7.55,-6),(x,7.55,9),.28,.30,WOOD)
for z in [-5.4+i*.85 for i in range(18)]:
 for side in [-1,1]:
  beam('Roof rafter',(0,9.05,z),(side*7.2,7.55,z),.16,.13,WOOD)
for side in [-1,1]:
 for i in range(11):
  x=side*i*.7;y=9.1-i*.146
  beam('Roof lath',(x,y,-6.0),(x,y,9),.10,.085,WOOD)
# Exposed ochre roofing tiles.
for side in [-1,1]:
 for i in range(10):
  x=side*(i+.5)*.7;y=9.11-i*.146
  obj=box('Clay roof lining',(x,y,-.0),(.71,.04,15),material('Roof clay '+str(side)+str(i),(.28+i*.008,.105,.035),0,.8))
  obj.rotation_euler.y=side*.205
# Side railings and carved balustrades.
for side in [-1,1]:
 x=side*6.5
 for h in [1.05,1.55,5.4,6.05]:beam('Side rail',(x,h,-6),(x,h,9),.15,.17,WOOD)
 for z in [-5+i*.6 for i in range(24)]:
  beam('Balustrade',(x,1.05,z),(x,1.55,z),.07,.06,WOOD)
  line('Balustrade ornament',[(x,5.45,z-.2),(x,5.8,z),(x,5.45,z+.2)],.025,DARKGOLD)
# Stone floor kept separate so the viewer can use a real reflection material.
CATEGORY='FLOOR';box('Stone',(0,-.08,1.2),(17,.16,22),FLOOR)
CATEGORY='DECOR'
for x in range(-8,9,2):box('Stone joint',(x,.002,1),(.013,.006,22),STONE)
for z in range(-9,13,2):box('Stone joint',(0,.002,z),(17,.006,.013),STONE)
box('Prayer carpet',(0,.012,7.5),(4.7,.016,3.2),RUG)
for x in [-2.3,2.3]:box('Carpet gold border',(x,.024,7.5),(.06,.005,3.15),DARKGOLD)
for z in [5.95,9.05]:box('Carpet gold border',(0,.024,z),(4.6,.005,.06),DARKGOLD)

# Great halo and carved lotus pedestal.
CATEGORY='STATUE';center=(0,0,-3.05)
lathe('Lotus pedestal',(0,.17,-3.05),[(1.9,0),(2.3,.12),(2.35,.25),(2.1,.4),(2,.7),(2.5,.85)],GOLD,64)
for y,r in [(.33,2.3),(.53,2.2),(.93,2.25),(1.17,2.45)]:torus('Throne ring',(0,y,-3.05),r,.065,EDGE)
for radius,y,count,height in [(2.0,.7,18,1.0),(1.65,1.18,15,.95),(1.3,1.63,12,.75)]:
 for i in range(count):
  a=i*math.tau/count;petal('Carved lotus petal',(radius*math.sin(a),y,-3.05+radius*math.cos(a)),.47,height,.34,a,GOLD,lean=.12)
# Solid circular halo with actual radial relief and outer foliage.
obj=cylinder('Halo disc',(0,4.23,-3.63),2.94,.13,HALO,96);obj.rotation_euler.x=math.pi/2
for r in [2.5,2.65,2.88,3.00]:torus('Halo rim',(0,4.23,-3.49),r,.042,EDGE,True)
for i in range(48):
 a=i*math.tau/48
 for radius,size in [(2.74,.17),(2.4,.11)]:
  x=math.sin(a)*radius;y=4.23+math.cos(a)*radius
  sphere('Halo carved bud',(x,y,-3.43),(size*.6,size,.05),GOLD,10)
 # Outer pierced leaf and flame-like crown silhouette.
 points=[(math.sin(a)*2.87,4.23+math.cos(a)*2.87,-3.48),(math.sin(a+.02)*3.12,4.23+math.cos(a+.02)*3.12,-3.45),(math.sin(a)*3.20,4.23+math.cos(a)*3.20,-3.48),(math.sin(a-.02)*3.12,4.23+math.cos(a-.02)*3.12,-3.45),(math.sin(a)*2.87,4.23+math.cos(a)*2.87,-3.48)]
 line('Halo floral outline',points,.022,GOLD)
for ring in [1.5,1.95,2.35]:
 for i in range(24):
  a=i*math.tau/24
  def h(u,v,z=-3.36):return (math.sin(a)*(ring+v)+math.cos(a)*u,4.23+math.cos(a)*(ring+v)-math.sin(a)*u,z)
  line('Floral branch',[h(-.1,-.16),h(.03,0),h(.04,.18)],.016,GOLD)
  for u,v,turn in [(-.08,-.06,-.55),(.10,.04,.6),(-.04,.12,-.45)]:
   leaf=sphere('Mandorla carved leaf',h(u,v),(.047,.105,.028),GOLD,12);leaf.rotation_euler.y=-a+turn
# Cross-legged body: rounded volumes, robe folds and hands are real geometry.
CATEGORY='SCULPT'
sphere('Left draped knee',(-1.13,2.55,-2.69),(1.25,.60,.78),GOLD,32)
sphere('Right draped knee',(1.13,2.55,-2.69),(1.25,.60,.78),GOLD,32)
line('Crossed shin',[(-1.72,2.5,-2.1),(-.65,2.36,-1.82),(.65,2.43,-2.05),(1.65,2.7,-2.7)],.34,GOLD)
line('Folded foot',[(1.65,2.75,-2.3),(.85,2.72,-2.02),(.25,2.8,-2.1)],.18,SKIN)
# Robe torso is a smoothly varying elliptical lathe.
profile=[(.86,0),(.76,.3),(.70,.62),(.82,.95),(.98,1.22),(.95,1.45),(.66,1.68),(.41,1.82)]
body=lathe('Draped torso',(0,2.87,-2.87),profile,GOLD,64)
# Flatten body depth around its own center rather than global origin.
for v in body.data.vertices:v.co.y=2.87+(v.co.y-2.87)*.66
sphere('Upper chest',(0,4.55,-2.86),(.70,.46,.43),SKIN,28)
cylinder('Neck',(0,4.97,-2.86),.30,.56,SKIN)
# The head is not a billboard: anatomical surface with sculpted bridge, cheeks and mouth.
sphere('Head',(0,5.86,-2.86),(.52,.73,.47),SKIN,36)
verts=[];faces=[];NX=48;NY=56
for j in range(NY+1):
 v=j/NY*2-1;y=5.86+.70*v
 for i in range(NX+1):
  u=i/NX*2-1;xx=.52*u*math.sqrt(max(.001,1-v*v))
  z=.45*math.sqrt(max(.001,1-(xx/.53)**2-v*v))
  # Nose bridge and tip, cheekbones, recessed eyes, philtrum and chin.
  z+=.08*math.exp(-((xx/.075)**2+((v-.02)/.35)**2))+.075*math.exp(-((xx/.09)**2+((v+.12)/.1)**2))
  z+=.035*(math.exp(-(((xx-.24)/.15)**2+((v+.13)/.24)**2))+math.exp(-(((xx+.24)/.15)**2+((v+.13)/.24)**2)))
  z-=.035*(math.exp(-(((xx-.22)/.13)**2+((v-.19)/.09)**2))+math.exp(-(((xx+.22)/.13)**2+((v-.19)/.09)**2)))
  z+=.038*math.exp(-((xx/.19)**2+((v+.40)/.13)**2))
  verts.append(p((xx,y,-2.86+z)))
for j in range(NY):
 for i in range(NX):
  a=j*(NX+1)+i;faces.append((a,a+1,a+NX+2,a+NX+1))
mesh=bpy.data.meshes.new('Sculpted face');mesh.from_pydata(verts,[],faces);mesh.update();obj=bpy.data.objects.new('Face',mesh);bpy.context.collection.objects.link(obj);finish(obj,'Sculpted face',SKIN)
for side in [-1,1]:
 sphere('Elongated ear',(side*.54,5.85,-2.86),(.12,.31,.10),SKIN,20)
 line('Ear fold',[(side*.56,6.02,-2.76),(side*.61,5.95,-2.72),(side*.58,5.65,-2.76)],.021,DARKGOLD)
 # Half-closed eyes and brows follow the surface of the golden face.
 line('Eyebrow',[(side*.09,6.06,-2.44),(side*.23,6.13,-2.46),(side*.35,6.06,-2.52)],.021,DARKGOLD)
 line('Upper eyelid',[(side*.10,5.99,-2.42),(side*.23,6.015,-2.435),(side*.34,5.98,-2.49)],.018,SKIN)
 line('Serene eye',[(side*.115,5.975,-2.417),(side*.23,5.96,-2.429),(side*.325,5.97,-2.482)],.011,EYE)
 sphere('Nostril',(side*.07,5.76,-2.30),(.028,.013,.016),DARKGOLD,12)
line('Upper lip',[(-.15,5.61,-2.445),(-.06,5.63,-2.405),(0,5.615,-2.393),(.06,5.63,-2.405),(.15,5.61,-2.445)],.018,LIP)
line('Lower lip',[(-.14,5.606,-2.445),(0,5.58,-2.39),(.14,5.606,-2.445)],.024,SKIN)
sphere('Urna',(0,6.18,-2.435),(.025,.027,.018),EDGE,12)
# Cap of tightly curled hair and ushnisha, individually sculpted bead clusters.
sphere('Hair cap',(0,6.30,-2.90),(.52,.36,.44),HAIR,24)
for rown in range(6):
 angle=.18+rown*.21;count=max(8,int(22*math.sin(angle+.3)))
 for i in range(count):
  a=i*math.tau/count+rown*.13
  sphere('Hair curl',(.50*math.sin(angle+.3)*math.cos(a),6.28+.34*math.cos(angle+.3),-2.90+.43*math.sin(angle+.3)*math.sin(a)),(.065,.062,.061),HAIR,8)
sphere('Ushnisha',(0,6.66,-2.9),(.17,.21,.17),HAIR,16)
# Right hand touches the knee, left palm rests upward in the lap.
line('Bare right forearm',[(-.84,4.12,-2.6),(-1.1,3.72,-2.21),(-1.25,3.35,-1.92)],.21,SKIN)
sphere('Right palm',(-1.25,3.12,-1.83),(.19,.27,.10),SKIN,24)
for i in range(4):
 x=-1.40+i*.10;line('Right finger',[(x,3.06,-1.75),(x-.01,2.86,-1.72),(x,2.72+abs(i-1.5)*.025,-1.77)],.045,SKIN)
line('Right thumb',[(-1.06,3.22,-1.79),(-1.02,3.06,-1.73),(-1.08,2.98,-1.72)],.055,SKIN)
line('Left forearm',[(.98,3.85,-2.6),(.95,3.35,-2.08),(.38,3.22,-1.95)],.18,SKIN)
sphere('Left palm',(.18,3.22,-1.89),(.30,.09,.17),SKIN,24)
for i in range(4):line('Left finger',[(-.03,3.23,-1.98+i*.07),(-.18,3.25,-1.98+i*.07),(-.26,3.29,-1.99+i*.07)],.038,SKIN)
line('Left thumb',[(.23,3.29,-1.78),(.01,3.36,-1.72),(-.12,3.32,-1.77)],.05,SKIN)
# Robe sleeves and many softly highlighted fold ridges.
line('Right sleeve',[(-.60,4.68,-2.82),(-.95,4.33,-2.75),(-1.1,3.89,-2.50)],.30,GOLD)
line('Left sleeve',[(.62,4.67,-2.83),(1.0,4.18,-2.73),(1.05,3.7,-2.5)],.35,GOLD)
verts=[];faces=[];N=44;M=36
for j in range(N+1):
 v=j/N
 for i in range(M+1):
  u=i/M;xx=-.86+1.72*u;top=4.22+.7*u;yy=3.06+(top-3.06)*v
  width=.90 if yy>4.05 else .82
  zz=-2.87+.54*math.sqrt(max(.12,1-(xx/width)**2))+.05+.036*math.sin(u*30+v*7)*(1-v*.25)
  verts.append(p((xx,yy,zz)))
for j in range(N):
 for i in range(M):
  a=j*(M+1)+i;faces.append((a,a+1,a+M+2,a+M+1))
mesh=bpy.data.meshes.new('Draped cloth');mesh.from_pydata(verts,[],faces);mesh.update();obj=bpy.data.objects.new('Drape',mesh);bpy.context.collection.objects.link(obj);finish(obj,'Draped front robe',GOLD)
solid=obj.modifiers.new('Cloth thickness','SOLIDIFY');solid.thickness=.05
line('Robe border',[(-.86,4.22,-2.50),(-.45,4.38,-2.32),(.1,4.62,-2.29),(.78,4.89,-2.61)],.035,EDGE)
for side in [-1,1]:
 for i in range(10):
  q=i*.07
  line('Knee robe fold',[(side*(.70+q),2.99-q*.1,-2.48),(side*(1.46+q*.5),2.85-q*.33,-2.10),(side*(1.8-q*.10),2.58-q*.32,-2.18)],.022,GOLD if i%2 else EDGE)
# Altar furniture and offerings.
CATEGORY='ALTAR'
for x,y,z,w in [(0,.65,-.45,3.2),(-2.6,.55,-.8,1.25),(2.6,.55,-.8,1.25)]:
 box('Altar table',(x,y,z),(w,.9,.65),WOOD,.035);box('Altar top',(x,y+.49,z),(w+.12,.10,.77),DARKGOLD,.015)
 for sx in [-1,1]:box('Altar foot',(x+sx*(w/2-.12),.16,z+.2),(.20,.32,.28),WOOD,.025)
 for k in range(max(1,int(w/.55))):
  xx=x-w/2+.3+k*.55
  line('Altar carved scroll',[(xx-.2,y+.1,z+.34),(xx-.1,y+.27,z+.36),(xx+.1,y+.1,z+.35),(xx,y-.12,z+.36)],.022,GOLD)
# Incense censer with handles, sculpted feet, ash and sticks.
lathe('Incense bronze bowl',(0,.5,1.05),[(.18,0),(.28,.08),(.4,.18),(.43,.35),(.36,.45),(.38,.50)],DARKGOLD,48)
for h,r in [(.58,.27),(.90,.41),(1,.38)]:torus('Censer trim',(0,h,1.05),r,.025,GOLD)
for side in [-1,1]:line('Censer handle',[(side*.37,.83,1.05),(side*.57,1.07,1.05),(side*.63,.83,1.04),(side*.38,.68,1.04)],.045,GOLD)
for a in [0,2.1,4.2]:line('Censer leg',[(.25*math.sin(a),.63,1.05+.25*math.cos(a)),(.30*math.sin(a),.35,1.05+.30*math.cos(a)),(.38*math.sin(a),.18,1.05+.38*math.cos(a))],.065,DARKGOLD)
for i in range(13):
 a=i*2.399;r=.14*math.sqrt(i/13);beam('Incense stick',(math.sin(a)*r,1,1.05+math.cos(a)*r),(math.sin(a)*r,1.6+(i%4)*.04,1.05+math.cos(a)*r),.012,.012,DARKGOLD)
# Porcelain vases and three-dimensional lotus bouquets.
for side in [-1,1]:
 x=side*2.20;z=.25
 lathe('Blue white porcelain vase',(x,.1,z),[(.17,0),(.20,.10),(.29,.38),(.25,.64),(.12,.78),(.11,.94),(.17,.98)],WHITE)
 for h,r in [(.24,.245),(.73,.17),(.98,.17)]:torus('Cobalt vase band',(x,h,z),r,.018,BLUE)
 for i in range(8):
  a=i*math.tau/8;petal('Cobalt painted leaf',(x+.27*math.sin(a),.3,z+.27*math.cos(a)),.048,.32,.01,a,BLUE)
 for i in range(10):
  a=i*2.399;r=.22+(.28 if i%2 else .1);px=x+math.sin(a)*r;pz=z+math.cos(a)*r;h=1.4+(i%4)*.15
  line('Flower stem',[(x,.8,z),(px,h-.13,pz),(px,h,pz)],.012,LEAF)
  for k in range(7):petal('Pink lotus blossom',(px,h-.08,pz),.075,.21,.09,k*math.tau/7,PINK if k%2 else PALE,lean=.1)
  sphere('Lotus heart',(px,h+.045,pz),(.045,.04,.045),GOLD,10)
  petal('Bouquet green leaf',(px,h-.4,pz),.19,.35,.14,a,LEAF,lean=.45)
# Lamps: physical frames with luminous amber glass.
def lantern(x,h,z,scale=1):
 for dx in [-.17,.17]:
  for dz in [-.17,.17]:beam('Lantern post',(x+dx*scale,h-.25*scale,z+dz*scale),(x+dx*scale,h+.25*scale,z+dz*scale),.022*scale,.022*scale,DARKGOLD)
 box('Lantern luminous glass',(x,h,z),(.30*scale,.44*scale,.30*scale),AMBER,.012)
 for y in [-.27,.27]:box('Lantern frame',(x,h+y*scale,z),(.42*scale,.05*scale,.42*scale),GOLD,.015)
 for a in [0,math.pi/2,math.pi,math.pi*1.5]:
  line('Lantern roof curl',[(x+.26*math.sin(a)*scale,h+.28*scale,z+.26*math.cos(a)*scale),(x+.10*math.sin(a)*scale,h+.40*scale,z+.10*math.cos(a)*scale),(x,h+.56*scale,z)],.025*scale,DARKGOLD)
 sphere('Lantern finial',(x,h+.59*scale,z),(.035*scale,.06*scale,.035*scale),GOLD,12)
for side in [-1,1]:
 for x,z in [(side*1.45,-.2),(side*3.1,-1.0)]:
  lathe('Lamp stand',(x,.1,z),[(.14,0),(.18,.04),(.12,.15),(.045,1.25),(.13,1.3)],GOLD)
  lantern(x,1.7,z,.85)
 for z in [-3.2,2.4,6.7]:
  lantern(side*5.5,4.7,z,.8);beam('Lantern suspension',(side*5.5,5.2,z),(side*5.5,7.45,z),.013,.013,DARKGOLD)
 # Fruit trays behind flowers.
 lathe('Fruit tray',(side*1.0,1.12,-.5),[(.12,0),(.08,.25),(.31,.32),(.32,.35)],GOLD)
 for rown in range(3):
  for i in range(4-rown):sphere('Orange offering',(side*1.0+(i-(3-rown)/2)*.13,1.54+rown*.12,-.5),(.075,.075,.075),FRUIT,12)
# Exterior garden: actual tree geometry visible through the openings.
CATEGORY='GARDEN'
for side in [-1,1]:
 for i,z in enumerate([-6,-1,5,11]):
  x=side*(9+(i%2)*1.2);beam('Garden tree trunk',(x,0,z),(x,5,z),.24,.24,WOOD)
  for k in range(22):
   a=k*2.399;r=.3+(k%5)*.27
   sphere('Garden foliage',(x+math.sin(a)*r,4.2+(k%4)*.55,z+math.cos(a)*r),(.65,.55,.6),LEAF,8)
# Bake modifiers/curves then join by category + material to bound draw calls.
bpy.ops.object.select_all(action='DESELECT')
objects=[o for o in bpy.context.scene.objects if o.type in {'MESH','CURVE'}]
for o in objects:o.select_set(True)
bpy.context.view_layer.objects.active=objects[0];bpy.ops.object.convert(target='MESH')
sculpt=[o for o in bpy.context.scene.objects if o.type=='MESH' and o.name.startswith('SCULPT__') and o.data.materials[0].name in [GOLD.name,SKIN.name,EDGE.name]]
bpy.ops.object.select_all(action='DESELECT')
for obj in sculpt:obj.select_set(True)
bpy.context.view_layer.objects.active=sculpt[0];bpy.ops.object.join();obj=bpy.context.object;obj.name='SCULPT__Continuous_body'
bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
remesh=obj.modifiers.new('Continuous sculpt','REMESH');remesh.mode='VOXEL';remesh.voxel_size=.025;remesh.use_smooth_shade=True
bpy.ops.object.modifier_apply(modifier=remesh.name)
smooth=obj.modifiers.new('Soft sculpt','SMOOTH');smooth.factor=.45;smooth.iterations=3;bpy.ops.object.modifier_apply(modifier=smooth.name)
obj.data.materials.clear();obj.data.materials.append(SKIN)
for poly in obj.data.polygons:poly.material_index=0
# Remove redundant coplanar detail without dropping the face or hand silhouette.
dec=obj.modifiers.new('Mobile surface','DECIMATE');dec.ratio=.5;bpy.ops.object.modifier_apply(modifier=dec.name)
groups=defaultdict(list)
for obj in list(bpy.context.scene.objects):
 if obj.type=='MESH':groups[(obj.name.split('__')[0],obj.data.materials[0].name)].append(obj)
for (category,mat),items in groups.items():
 bpy.ops.object.select_all(action='DESELECT')
 for obj in items:obj.select_set(True)
 bpy.context.view_layer.objects.active=items[0]
 if len(items)>1:bpy.ops.object.join()
 obj=bpy.context.object;obj.name=category+'__'+mat.replace(' ','_')
 for poly in obj.data.polygons:poly.material_index=0
 obj.data.validate(verbose=False);obj.data.update()
 # Tiny bevels keep wood edges from looking razor-sharp; all remaining geometry is authored mesh.
 for poly in obj.data.polygons:poly.use_smooth=True
# Emphasize the monumental statue, as in the reference, without flattening any geometry.
pivot=p((0,0,-3.05))
for obj in bpy.context.scene.objects:
 if obj.type=='MESH' and (obj.name.startswith('STATUE__') or obj.name.startswith('SCULPT__')):
  obj.matrix_world=Matrix.Translation(pivot) @ Matrix.Scale(1.12,4) @ Matrix.Translation(-pivot) @ obj.matrix_world
# Camera/lights for Blender source inspection; renderer uses its own interactive rig.
bpy.ops.object.camera_add(location=(0,-11,3));cam=bpy.context.object;target=Vector((0,2.6,3.6));cam.rotation_euler=(target-cam.location).to_track_quat('-Z','Y').to_euler();cam.data.lens=30;bpy.context.scene.camera=cam
bpy.context.scene.world.color=(.22,.18,.12)
for loc,energy,color,size in [((-6,-1,7),1800,(1,.75,.43),7),((5,-3,6),1400,(1,.84,.62),6),((0,-7,7),1800,(1,.90,.72),5)]:
 bpy.ops.object.light_add(type='AREA',location=loc);light=bpy.context.object;light.data.energy=energy;light.data.color=color;light.data.shape='DISK';light.data.size=size;light.rotation_euler=(Vector((0,2,3))-light.location).to_track_quat('-Z','Y').to_euler()
scene=bpy.context.scene;scene.render.engine='CYCLES';scene.cycles.samples=24;scene.render.resolution_x=1400;scene.render.resolution_y=900;scene.render.resolution_percentage=100
if opts.blend:bpy.ops.wm.save_as_mainfile(filepath=os.path.abspath(opts.blend))
os.makedirs(os.path.dirname(os.path.abspath(opts.output)),exist_ok=True)
bpy.ops.object.select_all(action='DESELECT')
for obj in bpy.context.scene.objects:
 if obj.type=='MESH':obj.select_set(True)
bpy.ops.export_scene.gltf(filepath=os.path.abspath(opts.output),export_format='GLB',use_selection=True,export_cameras=False,export_lights=False,export_materials='EXPORT',export_yup=True,export_draco_mesh_compression_enable=False)
print('SANCTUARY_EXPORT',os.path.getsize(opts.output),'bytes',len([o for o in scene.objects if o.type=='MESH']),'mesh groups')
