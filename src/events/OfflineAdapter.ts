import type {EventAdapter,EventSink} from './types';
import type {ReplayStep} from './fixtures';
/** Manual deterministic playback; no timers, network, credentials or package dependencies. */
export class OfflineAdapter implements EventAdapter {
 private sink:EventSink|null=null;
 private cursor=0;
 private steps:readonly ReplayStep[];
 constructor(steps:readonly ReplayStep[]){this.steps=steps;}
 start(sink:EventSink){this.sink=sink;}
 step(){if(!this.sink||this.cursor>=this.steps.length)return false;const item=this.steps[this.cursor++];if('event'in item)this.sink.event(item.event);else if('connection'in item)this.sink.connection(item.connection);else this.sink.error(item.error);return true;}
 stop(){this.sink?.connection('disconnected');this.sink=null;}
 get position(){return this.cursor;}
}
