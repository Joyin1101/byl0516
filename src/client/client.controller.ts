import { Res, Get, Post, Controller, Req, Param, Body, Query } from '@nestjs/common';
import { ClientService } from './client.service';
import AV = require('leancloud-storage');
import moment = require('moment');
const PageViewLogger = AV.Object.extend('PageViewLogger');
const Setting = AV.Object.extend('Setting');
const LuckyDogs = AV.Object.extend('LuckyDogs');
const GoldMaster = AV.Object.extend('GoldMaster');

@Controller()
export class ClientController {
  constructor(private readonly appService: ClientService) {}

  @Get()
  async root() {
    return 'Hi 白玉兰';
  }

  @Post('init')
  async init() {
    // const setting = new Setting();
    // setting.set('total', 10);
    // setting.set('daily', 3);
    // const res = await setting.save();
    // console.log(res);
    // return 'done';

    // const luckyList = new AV.Query('LuckyList');
    // const setting = new AV.Query('Setting');
    // luckyList.greaterThan('createdAt', );

    return moment(moment().format('l'));
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
    const luckyList = new AV.Query('LuckyDogs');
    const setting = new AV.Query('Setting');
    // console.log(new Date(moment(moment().format('l'), 'MM/DD/YYYY', false).format()));
    luckyList.greaterThanOrEqualTo('createdAt', new Date(moment(moment().format('l'), 'MM/DD/YYYY', false).format()));
    luckyList.lessThan('createdAt', new Date(moment(moment().add(1, 'd').format('l'), 'MM/DD/YYYY', false).format()));
    const rlt = await luckyList.count();

    const preference: any = await setting.first();
    console.log(preference.get('daily'));

    if ( rlt < preference.get('daily')){
      res.render('gift', { hasGift: true, gender: param.gender });
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
      console.log('2');
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

      res.render('share', { message: 'Gift!' });

    }

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
