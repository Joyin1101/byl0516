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

    if (totalBag > parseInt(total, 10)) {
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

  async hasGotDrink(phone): Promise<boolean> {
    const luckyDog = new AV.Query('LuckDogs');
    luckyDog.greaterThanOrEqualTo('createdAt', new Date(moment(moment().format('l'), 'MM/DD/YYYY', false).format()));
    luckyDog.lessThan('createdAt', new Date(moment(moment().add(1, 'd').format('l'), 'MM/DD/YYYY', false).format()));
    luckyDog.equalTo('phone', phone);
    const r = await luckyDog.count();
    return r > 0;
  }

  async checkFormAvailable(body): Promise<object> {
    const checkItem = {
      gender: body.gender,
      type: body.type,
      error: '',
      name: body.name,
      phone: body.phone,
    };
    if (body.name == null ) {
      checkItem.error = 'name';
      return checkItem;
    } else if (!(/^1[3|4|5|8][0-9]\d{4,8}$/.test(body.phone))){
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

  formatShareItem(imageItem, name): object {
    const imageUrls = {
      boy1: {
        previewUrl: 'http://byl0516.blissr.com.cn/boy1.png?',
        generateUrl: 'http://byl0516.blissr.com.cn/share-boy1.png?',
        subtitle: '，文艺绅也要“皮”一下! 约不？',
      },
      boy2: {
        previewUrl: 'http://byl0516.blissr.com.cn/boy2.png?',
        generateUrl: 'http://byl0516.blissr.com.cn/share-boy2.png',
        subtitle: '，人文咖内心很想“嗨”！约不？',
      },
      girl1: {
        previewUrl: 'http://byl0516.blissr.com.cn/girl1.png?',
        generateUrl: 'http://byl0516.blissr.com.cn/share-girl1.png?',
        subtitle: '，娇嗲任性够顽皮！敢约吗？',
      },
      girl2: {
        previewUrl: 'http://byl0516.blissr.com.cn/girl2.png?',
        generateUrl: 'http://byl0516.blissr.com.cn/share-girl2.png?',
        subtitle: '，精致女生都是完美控！敢约吗？',
      },
    };

    let previewUrl = imageUrls[imageItem].previewUrl + 'watermark/2/text/';
    let generateUrl = imageUrls[imageItem].generateUrl + 'watermark/2/text/';

    let temp = Buffer.from(name.toString('utf-8') + ',文艺绅也要"皮"一下!约不?').toString('base64');
    if (temp.indexOf('+') > 0) {
      temp = temp.replace(new RegExp('\\+', 'g'), '-');
    }
    if (temp.indexOf('/') > 0) {
      temp = temp.replace(new RegExp('\/', 'g'), '_');
    }
    previewUrl = previewUrl + temp + '/font/5a6L5L2T/fontsize/300/fill/IzRBNEE0QQ==/dissolve/100/gravity/West/dx/20/dy/60';
    generateUrl = generateUrl + temp + '/font/5a6L5L2T/fontsize/280/fill/IzRBNEE0QQ==/dissolve/100/gravity/Center/dx/0/dy/140';

    return {
      previewUrl,
      generateUrl,
    };
  }
  async sendMessageToUser(phone, type, date, time): Promise<boolean> {
    let content = '';
    if (type === 'bag') {
      content = '恭喜！成功预约领取白玉兰上海锦江乐园酒店开业大礼包！短信已发送到您手机，请凭短信在预约领取时段前往酒店签到领取。';
    }else {
      content = '预约成功短信验证文案: “恭喜您成功预约领取“相约摩天轮 白享一夏白”大礼包，请在x月x日 xx：xx～xx：xx 本人前往虹梅路227号白玉兰上海锦江乐园酒店，出示本短信完成签到注册步骤后即可领取礼包。咨询热线：400-820-9999”';
    }
    const jjUrl = `http://wxcj.jj-inn.com/api/ActivityApi/JJSendMsg?tel=${phone}&content=${content}&typecode=BYLHD`;
    let feedback = true;
    const options = {
      method: 'GET',
      uri: jjUrl,
    };
    let count = 1;

    while (feedback){
      feedback = await rp(options);
      count ++;
      if (count > 3){
        feedback = false;
      }
    }

    return feedback;
  }
}
