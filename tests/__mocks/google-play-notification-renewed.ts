import { IGoogleSubscriptionNotificationRequestBody } from '../../src/typings'

const notification: IGoogleSubscriptionNotificationRequestBody = {
  version: '1.0',
  packageName: 'com.aardwegmedia.playpost',
  eventTimeMillis: '1567331441388',
  subscriptionNotification: {
    version: '1.0',
    notificationType: 2,
    purchaseToken: 'johgnfjokiflpojfdnpgcofc.AO-J1Owfv2AVGDMHQ-d_KVUwjSR5jZr9Tv6Io5FNdAiXWKG0zzh1cR5gz5BRRpHIyJiTANmEp3Bgh3ws_SSc_Z4DGMmR_Axj3qISw4atWbC7lb-qUfWq-QM_D8AQgm5udlffidTv2z3wdxA0tfFWhitrlsEU3i1p8A',
    subscriptionId: 'com.aardwegmedia.playpost.premium'
  }
}

export default notification
