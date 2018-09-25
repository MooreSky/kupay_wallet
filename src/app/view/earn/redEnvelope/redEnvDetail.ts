/**
 * RedEnvDetail
 */
import { ShareToPlatforms } from '../../../../pi/browser/shareToPlatforms';
import { Json } from '../../../../pi/lang/type';
import { popNew } from '../../../../pi/ui/root';
import { Widget } from '../../../../pi/widget/widget';
import { getInviteCode, queryDetailLog, sharePerUrl } from '../../../net/pull';
import { RedEnvelopeType } from '../../../store/interface';
import { find } from '../../../store/store';

interface Props {
    rtype:number;  // 0 等额红包  1 拼手气红包
    rid:string;  // 红包ID
    curNum:number;  // 已领取个数
    totalNum:number;  // 总红包个数
    amount:number;  // 红包总金额
    ctypeShow:string;  // 货币类型名称
}
export class RedEnvDetail extends Widget {
    public props:Props;
    public ok: () => void;

    public setProps(props: Json, oldProps?: Json)  {
        super.setProps(props,oldProps);
        let cfg = this.config.value.simpleChinese;
        const lan = find('languageSet');
        if (lan) {
            cfg = this.config.value[lan.languageList[lan.selected]];
        }
        this.state = {
            message:cfg.message,
            redBagList:[
                // { cuid:111,amount:1,timeShow:'04-30 14:32:00' },
                // { cuid:111,amount:1,timeShow:'04-30 14:32:00' },
                // { cuid:111,amount:1,timeShow:'04-30 14:32:00' },
                // { cuid:111,amount:1,timeShow:'04-30 14:32:00' },
                // { cuid:111,amount:1,timeShow:'04-30 14:32:00' } 
            ],
            scroll:false,
            showPin:this.props.rtype === 1,  // 0 等额红包  1 拼手气红包
            cfgData:cfg
        };
        this.initData();
    }

    public async initData() {
        const value = await queryDetailLog(this.props.rid);
        if (!value) return;
        this.state.redBagList = value[0];        
        this.state.message = value[1];

        this.paint();
    }

    public backPrePage() {
        this.ok && this.ok();
    }

    /**
     * 页面滑动
     */
    public pageScroll() {
        if (document.getElementById('redEnvDetail').scrollTop > 0) {
            this.state.scroll = true;
            if (this.state.scroll) {
                this.paint();
            }

        } else {
            this.state.scroll = false;
            this.paint();
        }
    }

    /**
     * 继续发送红包
     */
    public async againSend() {
        let url = '';
        let title = '';
        if (this.props.rtype === 0) {
            // tslint:disable-next-line:max-line-length
            url = `${sharePerUrl}?type=${RedEnvelopeType.Normal}&rid=${this.props.rid}&lm=${(<any>window).encodeURIComponent(this.state.message)}`;
            title = this.state.cfgData.redEnvType[0]; 
        } else if (this.props.rtype === 1) {
            // tslint:disable-next-line:max-line-length
            url = `${sharePerUrl}?type=${RedEnvelopeType.Random}&rid=${this.props.rid}&lm=${(<any>window).encodeURIComponent(this.state.message)}`;
            title = this.state.cfgData.redEnvType[1]; 
        } else if (this.props.rid === '-1') {
            const inviteCodeInfo = await getInviteCode();
            if (inviteCodeInfo.result !== 1) return;
                
            url = `${sharePerUrl}?cid=${inviteCodeInfo.cid}&type=${RedEnvelopeType.Invite}`;
            title = this.state.cfgData.redEnvType[2];
        }
        popNew('app-components-share-share', { 
            shareType: ShareToPlatforms.TYPE_LINK,
            url,
            title,
            content:this.state.message
        });
        console.error(url);
    }
}
