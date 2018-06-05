import { Injectable } from '@nestjs/common';
import AV = require('leancloud-storage');
import moment = require('moment');
import rp = require('request-promise');
const PageViewLogger = AV.Object.extend('PageViewLogger');
const Setting = AV.Object.extend('Setting');
const LuckyDogs = AV.Object.extend('LuckyDogs');
const GoldMaster = AV.Object.extend('GoldMaster');

@Injectable()
export class ClientService {
  root(): string {
    return 'Hello World!';
  }
  async collectUa(ua, source): Promise<void> {
    const PVL = new PageViewLogger();
    PVL.set('source', source);
    PVL.set('ua', ua);

    if (ua.indexOf('MicroMessenger') > -1) {
      // 是否是微信
      PVL.set('Weixin', 1);
    }
    if (ua.indexOf('WeiBo') > -1) {
      // 是否是微博
      PVL.set('Weibo', 1);
    }
    if (!!ua.match(/AppleWebKit.*Mobile.*/) || !!ua.match(/AppleWebKit/)) {
      // 是否为移动终端
      PVL.set('Mobile', 1);
    }
    if (!!ua.match(/\(i[^;]+;( U;)? CPU.+Mac OS X/)) {
      // ios终端
      PVL.set('iOS', 1);
    }
    if (ua.indexOf('Android') > -1 ) {
      // android终端
      PVL.set('Android', 1);
    }
    if ( ua.indexOf('iPhone') > -1 ) {
      // 是否为iPhone
      PVL.set('iPhone', 1);
    }
    if ( ua.indexOf('iPad') > -1 ) {
      // 是否iPad
      PVL.set('iPad', 1);
    }
    await PVL.save();
  }

  async saveLuckDog(body, type): Promise<void> {
    const luckDog = new LuckyDogs();
    luckDog.set('type', type);
    luckDog.set('gender', body.gender);
    luckDog.set('name', body.name);
    luckDog.set('phone', body.phone);
    luckDog.set('pickDate', body.pick.split(' ')[0]);
    luckDog.set('pickTime', body.pick.split(' ')[1]);
    await luckDog.save();
  }

  getShareItems(name, gender): object {
    let shareItem1: any = {
      previewUrl: '',
      generateUrl: '',
    };
    let shareItem2: any = {
      previewUrl: '',
      generateUrl: '',
    };

    if (gender === 'boy') {
      shareItem1 = this.formatShareItem('boy1', name );
      shareItem2 = this.formatShareItem('boy2', name );

    } else {
      shareItem1 = this.formatShareItem('girl1', name );
      shareItem2 = this.formatShareItem('girl2', name );
    }

    return {
      share1: shareItem1.previewUrl,
      share2: shareItem2.previewUrl,
      previewShare1: shareItem1.generateUrl,
      previewShare2: shareItem2.generateUrl,
    };
  }

  async hasGift(): Promise<boolean> {
    // 查看全部已领奖品数量
    const luckyList = new AV.Query('LuckyDogs');
    luckyList.equalTo('type', 'bag');
    const totalBag = await luckyList.count();

    // 查看预设奖品总数
    const total = await this.querySetting('total');

    if (totalBag >= parseInt(total, 10)) {
      return false;
    } else {
      // 今日已领数量
      luckyList.greaterThanOrEqualTo('createdAt', new Date(moment(moment().format('l'), 'MM/DD/YYYY', false).format()));
      luckyList.lessThan('createdAt', new Date(moment(moment().add(1, 'd').format('l'), 'MM/DD/YYYY', false).format()));
      const rlt = await luckyList.count();

      // 查看今日奖品数量
      const daily = await this.querySetting('daily');

      if (rlt < parseInt(daily, 10)) {
        return true;
      } else {
        return false;
      }
    }
  }

  async isGotToday(phone): Promise<boolean> {
    // true: 今天领过了
    // false: 没领过
    const luckyDog = new AV.Query('LuckyDogs');
    luckyDog.greaterThanOrEqualTo('createdAt', new Date(moment(moment().format('l'), 'MM/DD/YYYY', false).format()));
    luckyDog.lessThan('createdAt', new Date(moment(moment().add(1, 'd').format('l'), 'MM/DD/YYYY', false).format()));
    luckyDog.equalTo('phone', phone);
    const r = await luckyDog.count();
    // console.log(r);
    return r > 0;
  }

  async checkFormAvailable(body): Promise<object> {
    const checkItem = {
      gender: body.gender,
      error: '',
      name: body.name,
      phone: body.phone,
    };
    if (body.name == null ) {
      checkItem.error = 'name';
      return checkItem;
    } else if (!(/^1[3|4|5|7|8][0-9]\d{4,8}$/.test(body.phone))){
      checkItem.error = 'phone';
      return checkItem;
    }else if (body.pick === '请选择可参与的时间段') {
      checkItem.error = 'date';
      return checkItem;
    }else {
      return checkItem;
    }
  }

  async checkIsFirst(phone): Promise<boolean> {
    // true: 可以领
    // false: 领过了
    const queryDog = new AV.Query('LuckyDogs');
    queryDog.equalTo('type', 'bag');
    queryDog.equalTo('phone', phone);
    const isDouble = await queryDog.count();
    return isDouble  < 1;
  }

  async checkIsSerial(phone): Promise<boolean> {
    const luckyList = new AV.Query('LuckyDogs');
    luckyList.equalTo('type', 'bag');
    luckyList.equalTo('phone', phone);
    const totalBag = await luckyList.count();

    if (totalBag > 2){
      return true;
    } else {
      return false;
    }
  }

  async jumpToGoldMaster(ua): Promise<void> {
    const goldMaster = new GoldMaster();
    goldMaster.set('ua', ua);
    await goldMaster.save();
  }

  async querySetting(k): Promise<string> {
    const setting = new AV.Query('Setting');
    setting.equalTo('k', k);
    const result: any = await setting.first();
    // const value = result.get('v');
    return result.get('v');
  }

  formatShareItem(gender, name): string {
    const imageUrls = {
      girl: 'http://byl0516.blissr.com.cn/girl.png?',
      boy: 'http://byl0516.blissr.com.cn/boy.png?',
    };

    let generateUrl = imageUrls[gender] + 'imageView2/0/q/100|watermark/2/text/';

    let temp = Buffer.from(name.toString('utf-8')).toString('base64');
    if (temp.indexOf('+') > 0) {
      temp = temp.replace(new RegExp('\\+', 'g'), '-');
    }
    if (temp.indexOf('/') > 0) {
      temp = temp.replace(new RegExp('\/', 'g'), '_');
    }
    generateUrl = generateUrl + temp + '/fontsize/700/fill/IzRBNEE0QQ==/dissolve/100/gravity/East/dx/60/dy/80';

    return generateUrl;
  }
  async sendMessageToUser(phone, type, date, time): Promise<boolean> {
    let content = '';
    if (type === 'bag') {
      content = `恭喜您成功预约领取“相约摩天轮 白享一夏白”大礼包，请在${date} ${date} 本人前往虹梅路227号白玉兰上海锦江乐园酒店，出示本短信完成签到注册步骤后即可领取礼包。咨询热线：400-820-9999`;
    }else {
      content = `恭喜您成功预约领取“相约摩天轮 白享一夏白”饮料券，请在${date} ${date} 本人前往虹梅路227号白玉兰上海锦江乐园酒店，出示本短信完成签到注册步骤后即可领取礼包。咨询热线：400-820-9999`;
    }
    const jjUrl = `http://wxcj.jj-inn.com/api/ActivityApi/JJSendMsg?tel=${phone}&content=${content}&typecode=BYLHD`;
    let feedback;
    const options = {
      method: 'GET',
      uri: jjUrl,
    };

    feedback = await rp(options);
    if (feedback === 'true') feedback = true;
    if (feedback === 'false') feedback = false;

    return feedback;
  }

}
