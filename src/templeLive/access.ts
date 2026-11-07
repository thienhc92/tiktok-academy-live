/** Server only. No secret, JWT, Access cookie or signing key is sent to application JS. */
export class AccessVerifier {
    private keys:Array<JsonWebKey&{kid?:string}>=[];private until=0;
    private issuer:string;private audience:string;private get:typeof fetch;
    constructor(issuer:string,audience:string,get:typeof fetch=fetch){this.issuer=issuer;this.audience=audience;this.get=get;}
    configured(){return /^https:\/\/[a-z0-9-]+\.cloudflareaccess\.com$/.test(this.issuer)&&this.audience.length>=16;}
    async verify(request:Request,now=Date.now()):Promise<boolean>{
        if(!this.configured())return false;
        try{
            const jwt=request.headers.get('Cf-Access-Jwt-Assertion');if(!jwt||jwt.length>8192)return false;
            const pieces=jwt.split('.');if(pieces.length!==3)return false;
            const bytes=(s:string)=>Uint8Array.from(atob(s.replace(/-/g,'+').replace(/_/g,'/')),c=>c.charCodeAt(0));
            const header=JSON.parse(new TextDecoder().decode(bytes(pieces[0]))),claim=JSON.parse(new TextDecoder().decode(bytes(pieces[1])));
            if(header.alg!=='RS256'||typeof header.kid!=='string'||claim.iss!==this.issuer||!Array.isArray(claim.aud)||!claim.aud.includes(this.audience)||!Number.isSafeInteger(claim.exp)||claim.exp<=now/1000||!Number.isSafeInteger(claim.iat)||claim.iat>now/1000+30||(claim.nbf!==undefined&&(!Number.isSafeInteger(claim.nbf)||claim.nbf>now/1000)))return false;
            if(now>=this.until){
                const response=await this.get(this.issuer+'/cdn-cgi/access/certs',{redirect:'error',signal:AbortSignal.timeout(5000)});
                if(!response.ok)return false;
                const data=await response.json() as {keys?:Array<JsonWebKey&{kid?:string}>};
                if(!Array.isArray(data.keys)||data.keys.length>16)return false;
                this.keys=data.keys;this.until=now+60000;
            }
            const jwk=this.keys.find(k=>k.kid===header.kid&&k.kty==='RSA'&&(!k.use||k.use==='sig'));if(!jwk)return false;
            const key=await crypto.subtle.importKey('jwk',jwk,{name:'RSASSA-PKCS1-v1_5',hash:'SHA-256'},false,['verify']);
            return await crypto.subtle.verify('RSASSA-PKCS1-v1_5',key,bytes(pieces[2]),new TextEncoder().encode(pieces[0]+'.'+pieces[1]));
        }catch{return false;}
    }
}
