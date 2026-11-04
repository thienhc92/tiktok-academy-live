import {SQLiteGameRepository} from '../../local/sqliteRepository.ts';
const [filename,event,mode]=process.argv.slice(2);
const repository=new SQLiteGameRepository(filename,point=>{if(point===mode)process.kill(process.pid,'SIGKILL');});
repository.process(JSON.parse(event));repository.close();
