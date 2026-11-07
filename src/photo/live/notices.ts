import type {LiveNotice} from '../liveModel.ts';

export const NOTICE_QUEUE_LIMIT=8;
/** Presentation only: committed rewards are unchanged when excess notices are skipped. */
export function enqueueNotice(queue:readonly LiveNotice[],notice:LiveNotice):LiveNotice[]{
    if(queue.length>=NOTICE_QUEUE_LIMIT||queue.some(item=>item.id===notice.id))return [...queue];
    return [...queue,notice];
}
