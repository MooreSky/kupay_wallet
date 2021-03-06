/**
 * @file 入口文件，用于登录，唤起hall界面
 * @author henk<speoth@163.com>
 */

// tslint:disable-next-line:no-any
// tslint:disable-next-line:no-reserved-keywords
declare const module;

import { backCall, backList, popNew, popMessage } from '../../../pi/ui/root';
import { Forelet } from '../../../pi/widget/forelet';
import { addWidget } from '../../../pi/widget/util';
import { openConnect } from '../../net/pull';
import { initPush } from '../../net/push';
import { LockScreen } from '../../store/interface';
import { initLocalStorageStore } from '../../store/localStorageStore';
import { find, initStore } from '../../store/store';
import { ExitApp } from '../../../pi/browser/exitApp';
// import{getTransaction as Account, Transation, getTokenTransaction as Token, TokenTransations} from "../../../index/rpc_call.s";
// import { Client } from "../../../pi/net/mqtt_c";
// import { create } from "../../../pi/net/rpc";
// import { Struct } from "../../../pi/struct/struct_mgr";

// let client;
// let rpc;
// ============================== 导出
export const forelet = new Forelet();
export const WIDGET_NAME = module.id.replace(/\//g, '-');
export const run = (cb): void => {
    addWidget(document.body, 'pi-ui-root');
    // 设置开发环境
    // eth代币精度初始化
    // 数据检查
    checkUpdate();
    // 初始化数据
    initStore();
    // 初始化localstorage
    initLocalStorageStore();
    // 主动推送初始化
    initPush();
    openConnect();
    // dataCenter.init();
    popNew('app-view-base-app');
    // popNew('app-view-chat-home-home');
    // getDeviceInfo();
    popNewPage();
    // 后台切前台
    backToFront();
    // 解决进入时闪一下问题
    setTimeout(() => {
        if (cb) cb();
    }, 20);
};

// const rpcFunc = (req:Struct, respClass:Function, callback:Function, timeout: number) => {
//     rpc(req, (r:Struct) =>{
//         if(!respClass || r instanceof respClass){
//             return callback(r);
//         }else{
//             console.log("RPCError:-------------------------------------------", r);
//             //console.log("RPCError:" + "返回类型" + r.constructor.name + "与" + respClass.name + "类型不匹配！")
//         }
//     }, timeout);
// }
// export const test = () => {
//     var options = {
//         timeout: 3,
//         keepAliveInterval: 60,
//         cleanSession: false,
//         useSSL: false,
//         mqttVersion:3,
//         onSuccess: () => {
//             rpc = create(client, (<any>self).__mgr);
//             let q = new Account();
//             q.name = "0x267be1c1d684f78cb4f6a176c4911b741e4ffdc0";
//             rpcFunc(q, Transation, (r: Transation) => {
//                 console.log("------------r", r);
//             },2000);

//             let q1 = new Token();
//             q1.contractAddress = "0x0d8775f648430679a709e98d2b0cb6250d2887ef";
//             q1.userAddress = "0x9c808cd59d94a07053658b00ea12d8e9cbbe8304";
//             rpcFunc(q1, TokenTransations, (r: TokenTransations) => {
//                 console.log("------------r", r);
//             },2000);
//         },
//         onFailure: () =>{
//             console.log("connect fail");
//         }
//     };
//     client = new Client("127.0.0.1", 1234, "clientId-wcd14PDgoZ", null, options);
// }
/**
 * 界面入口
 */
const popNewPage = () => {
    const readedPriAgr = find('readedPriAgr');
    if (!readedPriAgr) {
        if (ifNeedUnlockScreen()) {
            popNew('app-components1-lockScreenPage-lockScreenPage', { firstFg: false, open: true });
        }

    } else {
        // popNew('app-view-guidePages-privacyAgreement');
    }
};
const checkUpdate = () => {
    // todo
};

/**
 * 后台切换到前台
 * onBackPressed
 */
const backToFront = () => {
    (<any>window).handle_app_lifecycle_listener = (iType: string) => {
        if ((iType === 'onAppResumed') && ifNeedUnlockScreen()) {
            popNew('app-components1-lockScreenPage-lockScreenPage', { firstFg: false, open: true });
        } else if (iType === 'onBackPressed') {
            if (backList.length === 1) {
                const exitApp = new ExitApp();
                exitApp.init();
                exitApp.ToHome({});
            }
            else {
                backCall();
            }
            // (<any>window).onpopstate();
            // widget.ok && widget.ok();
        }
    };
};

// ============================== 立即执行

/**
 * 是否需要解锁屏幕
 */
const ifNeedUnlockScreen = () => {
    const unlockScreen = document.getElementById('keyboard');
    if (unlockScreen) return false;
    const ls: LockScreen = find('lockScreen') || {};
    const lockScreenPsw = ls.psw;
    const openLockScreen = ls.open !== false;

    return lockScreenPsw && openLockScreen;
};
