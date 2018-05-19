import { Res, Get, Post, Controller, Req, Param, Body, Query } from '@nestjs/common';
import { ClientService } from './client.service';
import AV = require('leancloud-storage');
import moment = require('moment');
import base64url from 'base64url';
// import { shareBoy1 } from './../helper/shareItem.js';
const PageViewLogger = AV.Object.extend('PageViewLogger');
const Setting = AV.Object.extend('Setting');
const LuckyDogs = AV.Object.extend('LuckyDogs');
const GoldMaster = AV.Object.extend('GoldMaster');

const boy1 = 'http://byl0516.blissr.com.cn/share-boy1.png?';
const boy2 = 'http://byl0516.blissr.com.cn/share-boy2.png?';
const girl1 = 'http://byl0516.blissr.com.cn/share-girl1.png?';
const girl2 = 'http://byl0516.blissr.com.cn/share-girl2.png?';

@Controller()
export class ClientController {
  constructor(private readonly appService: ClientService) {}

  @Get()
  async root() {
    return 'Hi 白玉兰';
  }
  @Get('MP_verify_i81jI4DRd4D2xwG3.txt')
  async mp() {
    return 'i81jI4DRd4D2xwG3';
  }
  @Get('mp/MP_verify_i81jI4DRd4D2xwG3.txt')
  async mpVeri() {
    return 'i81jI4DRd4D2xwG3';
  }

  @Post('init')
  async init() {
    const setTotal = new Setting();
    setTotal.set('k', 'total');
    setTotal.set('v', '10');
    const setDaily = new Setting();
    setDaily.set('k', 'daily');
    setDaily.set('v', '3');
    const setJump = new Setting();
    setJump.set('k', 'jumpTo');
    setJump.set('v', 'http://byl0516.leanapp.cn/');
    const res = await AV.Object.saveAll([setTotal, setDaily, setJump]);
    console.log(res);
    return 'done';

    // const luckyList = new AV.Query('LuckyList');
    // const setting = new AV.Query('Setting');
    // luckyList.greaterThan('createdAt', );

    // return moment(moment().format('l'));
  }

  // 首页loading页面
  @Get('loading/:source')
  async loading(@Res() res, @Req() req, @Param() param) {
    if (param.source !== 'test') {

      const ua = req.headers['user-agent'];
      const PVL = new PageViewLogger();

      PVL.set('source', param.source);
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

    res.render('loading', { message: 'Hello world!' });
  }

  // 选择性别
  @Get('gender')
  testGender(@Res() res) {
    // console.log(body);
    // console.log(req);
    res.render('gender');
  }

  // 聊天性别
  @Get('chat/:gender')
  index(@Res() res, @Param() param) {
    if (param.gender === 'girl') {
      res.render('chat', { isGirl: true});
    } else {
      res.render('chat', { isGirl: false });
    }
  }

  // 选择礼物页面
  @Get('gift/:gender')
  async gift(@Res() res, @Param() param){
    // 获得全部奖品数量
    const luckyList = new AV.Query('LuckyDogs');
    luckyList.equalTo('type', 'bag');
    const totalBag = await luckyList.count();

    // 获得预设奖品数量
    const setting = new AV.Query('Setting');
    setting.equalTo('k', 'total');
    const presetTotal: any = await setting.first();

    if (totalBag <= parseInt(presetTotal.get('v'), 10)) {
      // console.log(new Date(moment(moment().format('l'), 'MM/DD/YYYY', false).format()));
      luckyList.greaterThanOrEqualTo('createdAt', new Date(moment(moment().format('l'), 'MM/DD/YYYY', false).format()));
      luckyList.lessThan('createdAt', new Date(moment(moment().add(1, 'd').format('l'), 'MM/DD/YYYY', false).format()));
      const rlt = await luckyList.count();

      setting.equalTo('k', 'daily');
      const preference: any = await setting.first();
      console.log(preference.get('v'));
      console.log(rlt);

      if ( rlt < parseInt(preference.get('v'), 10)){
        console.log('hasgift');
        res.render('gift', { hasGift: true, gender: param.gender });
      } else {
        res.render('gift', { hasGift: false, gender: param.gender });
      }
    } else {
      res.render('gift', { hasGift: false, gender: param.gender });
    }

    // preference.get('daily');

  }

  // @Post('form')
  // form(@Res() res, @Query() query){
  //   // console.log(body);
  //   res.render('form', {
  //     gender: query.gender,
  //     type: query.type,
  //     error: '',
  //     name: '',
  //     phone: '',
  //   });
  // }
  @Get('form')
  testForm(@Res() res, @Query() query){
    // console.log(query);
    res.render('form', {
      gender: query.gender,
      type: query.type,
      error: '',
      name: '',
      phone: '',
    });
  }

  @Post('success')
  async share(@Res() res, @Body() body){
    console.log(body);
    const checkItem = {
      gender: body.gender,
      type: body.type,
      error: '',
      name: body.name,
      phone: body.phone,
    };
    if (body.name == null ) {
      checkItem.error = 'name';
      res.render('form', checkItem);
      return false;
    } else if (!(/^1[3|4|5|8][0-9]\d{4,8}$/.test(body.phone))){
      checkItem.error = 'phone';
      res.render('form', checkItem);
      return false;
    }else if (body.pick === '请选择可参与的时间段') {
      checkItem.error = 'date';
      res.render('form', checkItem);
      return false;
    } else {
      const queryDog = new AV.Query('LuckyDogs');
      queryDog.equalTo('phone', body.phone);
      const isDouble = await queryDog.count();
      console.log(body.phone);
      console.log(isDouble);

      if (isDouble < 1 ){
        const luckDog = new LuckyDogs();
        luckDog.set('type', body.type);
        luckDog.set('gender', body.gender);
        luckDog.set('name', body.name);
        luckDog.set('phone', body.phone);
        luckDog.set('pickDate', body.pick.split(' ')[0]);
        luckDog.set('pickTime', body.pick.split(' ')[1]);
        await luckDog.save();

        // console.log(body);
        // const luckyDog = new LuckyDogs();
        // luckDog
        const setting = new AV.Query('Setting');
        setting.equalTo('k', 'jumpTo');
        const jumpTo: any = await setting.first();

        let share1 = '';
        let share2 = '';
        if (body.gender === 'boy') {
          share1 = boy1 + 'watermark/2/text/';
          share1 += base64url(body.name + '，人文咖内心很想“嗨”！约不？') + '/font/5a6L5L2T/fontsize/320/fill/IzRBNEE0QQ==/dissolve/100/gravity/West/dx/30/dy/20';

          share2 = boy2 + 'watermark/2/text/';
          share2 += base64url(body.name) + '/font/5a6L5L2T/fontsize/360/fill/IzRBNEE0QQ==/dissolve/100/gravity/NorthWest/dx/100/dy/32';
        } else {
          share1 = girl1 + 'watermark/2/text/';
          share1 += base64url(body.name + '，人文咖内心很想“嗨”！约不？') + '/font/5a6L5L2T/fontsize/320/fill/IzRBNEE0QQ==/dissolve/100/gravity/West/dx/30/dy/20';

          share2 = girl2 + 'watermark/2/text/';
          share2 += base64url(body.name) + '/font/5a6L5L2T/fontsize/360/fill/IzRBNEE0QQ==/dissolve/100/gravity/NorthWest/dx/100/dy/32';
        }
        // console.log(url);

        res.render('share', {
          jumpTo: jumpTo.get('v') ,
          share1,
          share2,
        });

      } else {
        checkItem.error = 'phone';
        res.render('form', checkItem);
      }

    }

  }
  @Get('success')
  shareIn(@Res() res) {
    res.redirect('/loading/test');
  }

  // operation
  @Get('jump')
  jump(@Res() res) {
    res.redirect('http://www.baidu.com/');
  }

  // Test part
  @Get('test-redis')
  testRedis(): string {
    const AVRedis = 'REDIS_URL_HaTP9qLw8N';
    const client = require('redis').createClient(process.env[AVRedis]);
    // client.set('test', 'ttttt');
    // client.set('test1', 1);
    client.incr('test1');
    client.on('error', (err) => {
      return console.error('redis err: %s', err);
    });
    client;
    return this.appService.root();
  }
  @Get('test-jade')
  testJade(@Res() res) {
    res.render('index', { message: 'Hello world!' });
  }
  @Get('./test-msg')
  async testMsg(@Res() res) {

    await AV.Cloud.requestSmsCode({
      mobilePhoneNumber: '186xxxxxxxx',
      template: 'Order_Notice',
      sign: 'sign_BuyBuyBuy',
    });

    return this.appService.root();
  }
}
