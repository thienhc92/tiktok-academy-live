import {MOCK_GIFT_TIERS} from './merit.ts';
import {contributionReward} from '../liveModel.ts';

/** Display presets only; all points still come from the validated event processor. */
export const MOCK_GIFTS=Object.freeze(MOCK_GIFT_TIERS.map((coins,index)=>Object.freeze({
    coins,icon:['🎁','🌸','🪷','✨'][index],nameKey:'Temple mock gift '+coins,
    points:contributionReward({kind:'gift',coins}),
})));
export function mockGift(coins:number){return MOCK_GIFTS.find(gift=>gift.coins===coins);}
