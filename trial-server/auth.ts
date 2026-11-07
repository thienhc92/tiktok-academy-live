import {randomBytes,createHash,timingSafeEqual} from 'node:crypto';
/** Trial-only owner login. Secrets stay in env; browser gets only an HttpOnly session. */
export class TrialAuth {
 private sessions=new Map<string,number>();private failures=0;private window=0;
 private password:string;private origin:string;private now:()=>number;
 constructor(password:string,origin:string,now=()=>Date.now()){this.password=password;this.origin=origin;this.now=now;}
 configured(){return this.password.length>=16;}
 async verify(request:Request){const token=/(?:^|;\s*)temple_trial=([a-f0-9]{64})(?:;|$)/.exec(request.headers.get('Cookie')??'')?.[1];return !!token&&(this.sessions.get(this.hash(token))??0)>this.now();}
 private hash(value:string){return createHash('sha256').update(value).digest('hex');}
 async login(request:Request):Promise<Response>{
  const headers={'Cache-Control':'no-store','Content-Security-Policy':"default-src 'none'; form-action 'self'; base-uri 'none'; frame-ancestors 'none'",'Referrer-Policy':'same-origin'};
  if(!this.configured())return new Response('Đặt TRIAL_ADMIN_PASSWORD tối thiểu 16 ký tự trong môi trường máy chủ.',{status:503,headers});
  if(request.method==='GET')return new Response('<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>Đăng nhập thử nghiệm</title><h1>Chùa Online — thử nghiệm riêng</h1><form method="post"><label>Mật khẩu quản trị thử nghiệm <input name="password" type="password" autocomplete="current-password" required maxlength="256"></label><button>Đăng nhập</button></form>',{headers:{...headers,'Content-Type':'text/html;charset=utf-8'}});
  if(request.method!=='POST'||request.headers.get('Origin')!==this.origin||!request.headers.get('Content-Type')?.startsWith('application/x-www-form-urlencoded'))return new Response(null,{status:403,headers});
  if(this.now()-this.window>60000){this.window=this.now();this.failures=0;}if(this.failures>=5)return new Response('Thử lại sau.',{status:429,headers});
  const reader=request.body?.getReader();let text='';if(!reader)return new Response(null,{status:400});
  while(true){const chunk=await reader.read();if(chunk.done)break;text+=new TextDecoder().decode(chunk.value);if(text.length>1024){await reader.cancel();return new Response(null,{status:413,headers});}}
  const supplied=new URLSearchParams(text).get('password')??'';
  if(!timingSafeEqual(Buffer.from(this.hash(supplied),'hex'),Buffer.from(this.hash(this.password),'hex'))){this.failures++;return new Response('Đăng nhập không hợp lệ.',{status:401,headers});}
  for(const [key,expiry]of this.sessions)if(expiry<=this.now())this.sessions.delete(key);if(this.sessions.size>=8)return new Response('Đã đạt giới hạn phiên thử nghiệm.',{status:429,headers});
  const token=randomBytes(32).toString('hex');this.sessions.set(this.hash(token),this.now()+2*3600000);
  return new Response(null,{status:303,headers:{...headers,Location:'/admin/tiktok','Set-Cookie':`temple_trial=${token}; HttpOnly; SameSite=Strict; Path=/; Max-Age=7200${this.origin.startsWith('https:')?'; Secure':''}`}});
 }
}
