/**
 * account home
 */
import { popNew } from '../../../../pi/ui/root';
import { Forelet } from '../../../../pi/widget/forelet';
import { resize } from '../../../../pi/widget/resize/resize';
import { Widget } from '../../../../pi/widget/widget';
import { GlobalWallet } from '../../../core/globalWallet';
import { selectImage } from '../../../logic/native';
import { setUserInfo, uploadFile } from '../../../net/pull';
import { find, register, updateStore } from '../../../store/store';
import { walletNameAvailable } from '../../../utils/account';
import { getLanguage, getUserInfo, popNewMessage, popPswBox } from '../../../utils/tools';
import { backupMnemonic, getMnemonic } from '../../../utils/walletTools';
// ================================ 导出
// tslint:disable-next-line:no-reserved-keywords
declare var module: any;
export const forelet = new Forelet();
export const WIDGET_NAME = module.id.replace(/\//g, '-');

export class AccountHome extends Widget {
    public ok:() => void;
    public create() {
        super.create();
        this.init();
    }
    public init() {
        const userInfo = getUserInfo();
        const wallet = find('curWallet');
        const gwlt = wallet ? JSON.parse(wallet.gwlt) : null;
        const backup = gwlt.mnemonicBackup;
        const cfg = getLanguage(this);

        this.state = {
            avatar:'',
            nickName:'',
            phone:cfg.bindPhone,
            backup,
            cfgData:cfg,
            userInput:false
        };
        if (userInfo) {
            if (userInfo.bphone) {
                const str = String(userInfo.bphone).substr(3,6);
                this.state.phone = userInfo.bphone.replace(str,'******');
            }
            this.state.nickName = userInfo.nickName ? userInfo.nickName :cfg.defaultName;
            this.state.avatar = userInfo.avatar ? userInfo.avatar : '../../../res/image/default_avater_big.png';
        }
        this.paint();
    }
    
    /**
     * 返回上一页
     */
    public backPrePage() {
        this.ok && this.ok();
    }

    /**
     * 修改名字输入框取消聚焦
     */
    public walletNameInputBlur() {
        const v = this.state.nickName;
        const userInfo = getUserInfo();
        this.state.userInput = false;
        if (!walletNameAvailable(v)) {
            popNewMessage(this.state.cfgData.tips[0]);

            return;
        }
        if (v !== userInfo.nickName) {
            const wallet = find('curWallet');
            const gwlt = GlobalWallet.fromJSON(wallet.gwlt);
            gwlt.nickName = v;
            wallet.gwlt = gwlt.toJSON();
            updateStore('curWallet', wallet);
            
            userInfo.nickName = v;
            updateStore('userInfo',userInfo);
            setUserInfo();
        }
        this.paint();
    }

     // 修改钱包名称
    public walletNameInputChange(e:any) {
        this.state.nickName = e.value;
    }

    public async backupWalletClick() {
        const psw = await popPswBox();
        if (!psw) return;
        const ret = await backupMnemonic(psw);
        if (ret) {
            popNew('app-view-wallet-backup-index',{ ...ret });
        }

    }

    // 导出私钥
    public async exportPrivateKeyClick() {
        const wallet = find('curWallet');
        const psw = await popPswBox();
        if (!psw) return;
        const close = popNew('app-components1-loading-loading', { text: this.state.cfgData.loading });
        try {
            const mnemonic = await getMnemonic(wallet, psw);
            if (mnemonic) {
                popNew('app-view-mine-account-exportPrivateKey', { mnemonic });
            } else {
                popNewMessage(this.state.cfgData.tips[1]);
            }
        } catch (error) {
            console.log(error);
            popNewMessage(this.state.cfgData.tips[1]);
        }
        close.callback(close.widget);
    }

    public uploadAvatar() {
        selectImage((width, height, base64) => {
            resize({ url:base64, width: 140, ratio: 0.3, type: 'jpeg' },(res) => {
                console.log('resize---------',res);
                this.state.chooseImage = true;
                // tslint:disable-next-line:max-line-length
                // this.state.avatarHtml = `<div style="background-image: url(${res.base64});width: 100%;height: 100%;position: absolute;top: 0;background-size: cover;background-position: center;background-repeat: no-repeat;border-radius:50%"></div>`;
                this.state.avatar = res.base64;
                this.paint();
                uploadFile(this.state.avatar);
            });
        });

    }

    /**
     * 绑定手机号
     */
    public changePhone() {
        popNew('app-view-mine-setting-phone');
    }

    /**
     * 修改密码
     */
    public changePsw() {
        popNew('app-view-mine-setting-changePsw');
    }

    /**
     * 点击可输入用户名
     */
    public changeInput() {
        this.state.userInput = true;
        this.paint();
    }
}
register('userInfo', () => {
    const w: any = forelet.getWidget(WIDGET_NAME);
    if (w) {
        w.init();
    }
});
register('curWallet', () => {
    const w: any = forelet.getWidget(WIDGET_NAME);
    if (w) {
        w.init();
    }
});