import type {EventAdapter,EventSink} from '../../events/types.ts';
import type {TempleEvent,TempleViewer} from './events.ts';
import type {LiveAction} from '../liveModel.ts';
/** Offline adapter only. It never uses fetch/WebSocket or loads a connector SDK. */
export class MockTempleSource implements EventAdapter {
    private sink:EventSink|null=null;
    start(sink:EventSink){this.sink=sink;sink.connection('connected');}
    emit(event:TempleEvent){this.sink?.event(event);}
    stop(){this.sink?.connection('disconnected');this.sink=null;}
}
export class UnconfiguredLiveSource implements EventAdapter {
    start(sink:EventSink){sink.connection('disconnected');sink.error('Temple LIVE unavailable');}
    stop(){}
}
export function mockTempleEvent(action:LiveAction|'leave',viewer:TempleViewer,session:{sessionId:string;roomId:string},eventId:string,now:number,text?:string,coins?:number):TempleEvent {
    const base={version:1 as const,source:'mock',roomId:session.roomId,sessionId:session.sessionId,eventId,occurredAt:now,receivedAt:now,viewer};
    if(action==='wish')return {...base,kind:'comment',text:text??''};
    if(action==='like')return {...base,kind:'like',likes:{mode:'delta',count:1}};
    if(action==='gift')return {...base,kind:'gift',giftId:'mock-gift',streakId:eventId,repeatCount:1,final:true,coins:coins??0};
    return {...base,kind:action};
}
