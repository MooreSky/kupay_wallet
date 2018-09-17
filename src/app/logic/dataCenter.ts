import { ERC20Tokens } from '../config';
import { BtcApi } from '../core/btc/api';
import { BTCWallet } from '../core/btc/wallet';
import { Api as EthApi } from '../core/eth/api';
import { EthWallet } from '../core/eth/wallet';
import { getShapeShiftCoins, getTransactionsByAddr } from '../net/pullWallet';
import { Addr, CurrencyRecord, Wallet, TransRecordLocal } from '../store/interface';
import { find, getBorn, updateStore } from '../store/store';
import { btcNetwork, ethTokenTransferCode, lang } from '../utils/constants';
import { getAddrsAll, getAddrsByCurrencyName, initAddr } from '../utils/tools';
import { btc2Sat, ethTokenDivideDecimals, sat2Btc, wei2Eth } from '../utils/unitTools';
import { getMnemonic } from '../utils/walletTools';
/**
 * 创建事件处理器表
 * @example
 */
export class DataCenter {
    public static MAX_ADDRNAME_LEN: number = 9;// 最长地址名

    public static MAX_SHARE_LEN: number = 3;
    public static MIN_SHARE_LEN: number = 2;
    public static SHARE_SPLIT: string = '&&&&';
    public static MNEMONIC_SPLIT: string = ' ';
    public static LIMIT_CONFIRMATIONS: number = 1;

    public addrs: string[] = [];
    public timerRef: number = 0;
    public timerRef1: number = 0;

    public transactions: any[] = [];

    public updateFastList: any[] = [];
    public updateList: any[] = [];

    public currencyExchangeTimer: number;

    /**
     * 初始化
     */
    public init() {

        // 启动定时器更新
        if (!this.timerRef) this.openCheckFast();
        if (!this.timerRef1) this.openCheck();

        this.updateFastList.push(['shapeShiftCoins']);
        this.updateFastList.push(['exchangeRate', 'ETH']);
        this.updateFastList.push(['exchangeRate', 'BTC']);

        this.refresh();

        // if (!this.currencyExchangeTimer) this.currencyExchangeTimerStart();
    }
    /**
     * 刷新本地钱包
     */
    public refresh() {
        // 从缓存中获取地址进行初始化
        const addrs = find('addrs');
        if (addrs) {
            const wallet = find('curWallet');
            if (!wallet) return;
            let list = [];
            wallet.currencyRecords.forEach(v => {
                if (wallet.showCurrencys.indexOf(v.currencyName) >= 0) {
                    list = list.concat(v.addrs);
                }
            });
            addrs.forEach(v => {
                if (list.indexOf(v.addr) >= 0 && wallet.showCurrencys.indexOf(v.currencyName) >= 0) {
                    this.updateAddrInfo(v.addr, v.currencyName);
                }
            });
        }
    }

    /**
     * updateAddrInfo
     */
    public updateAddrInfo(addr: string, currencyName: string) {
        this.updatetTransaction(addr, currencyName);
    }

    /**
     * 通过货币类型获取当前钱包地址详情
     */
    public getAddrInfosByCurrencyName(currencyName: string) {
        const wallet = find('curWallet');
        if (!wallet) return;
        const retAddrs = getAddrsByCurrencyName(wallet, currencyName);
        const addrs = find('addrs') || [];

        return addrs.filter(v => retAddrs.indexOf(v.addr) !== -1 && v.currencyName === currencyName);
    }

    /**
     * 通过地址获取地址余额
     */
    public getAddrInfoByAddr(addr: string, currencyName: string) {
        const addrs = find('addrs') || [];

        return addrs.filter(v => v.addr === addr && v.currencyName === currencyName)[0];
    }

    /**
     * 更新记录
     */
    public updatetTransaction(addr: string, currencyName: string) {
        this.updateFastList.push(['balance', addr, currencyName]);
        this.updateFastList.push(['transaction', addr, currencyName]);
    }
    
    // 获取币币交易交易记录
    public fetchCurrencyExchangeTx() {
        const wallet = find('curWallet');
        if (!wallet) return;
        const curAllAddrs = getAddrsAll(wallet);
        curAllAddrs.forEach(item => {
            getTransactionsByAddr(item);
        });

    }

    /****************************************************************************************************
     * 私有函数
     ******************************************************************************************/

    // 快速检测
    private openCheckFast() {
        this.refresh();
        this.timerRef = setTimeout(() => {
            this.timerRef = 0;
            this.openCheckFast();
        }, 10 * 1000);
        for (let i = 0;i < this.updateFastList.length; i ++) {
            const update = this.updateFastList[i];
            // console.log('openCheck updateFastList', update);
            switch (update[0]) {
                case 'transaction': this.parseTransactionDetails(update[1], update[2]); break;
                // case 'BtcTransactionTxref': this.parseBtcTransactionTxrefDetails(update[1], update[2]); break;
                case 'balance': this.updateBalance(update[1], update[2]); break;
                case 'exchangeRate': this.exchangeRate(update[1]); break;
                case 'shapeShiftCoins': getShapeShiftCoins();break;
                default:
            }
        }
        this.updateFastList = [];
    }

    // 普通检测
    private openCheck() {
        this.timerRef = setTimeout(() => {
            this.timerRef = 0;
            this.openCheck();
        }, 5 * 1000);
        if (this.updateFastList.length > 0) return;
        if (this.updateList.length > 0) {
            // todo doupdate
            return;
        }

        // 检查地址--放于最后一步
        // this.checkAddr();
    }

    // 币币交易记录定时器
    private currencyExchangeTimerStart() {
        this.fetchCurrencyExchangeTx();
        this.currencyExchangeTimer = setTimeout(() => {
            this.currencyExchangeTimerStart();
        }, 30 * 1000);
    }
    private async checkAddr() {
        const walletList = find('walletList');
        if (!walletList || walletList.length <= 0) return;
        const list = [];
        walletList.forEach((v, i) => {
            if (getBorn('hashMap').get(v.walletId)) {
                v.currencyRecords.forEach((v1, i1) => {
                    if (!v1.updateAddr) list.push([i, i1]);
                });
            }
        });

        if (list[0]) {
            let addrs = find('addrs');
            const wallet = walletList[list[0][0]];
            const currencyRecord: CurrencyRecord = wallet.currencyRecords[list[0][1]];
            console.log('checkAddr', currencyRecord.currencyName);
            let addAddrs;
            if (currencyRecord.currencyName === 'ETH') {
                addAddrs = await this.checkEthAddr(wallet, currencyRecord);
            } else if (currencyRecord.currencyName === 'BTC') {
                addAddrs = await this.checkBtcAddr(wallet, currencyRecord);
            } else if (ERC20Tokens[currencyRecord.currencyName]) {
                addAddrs = await this.checkEthERC20TokenAddr(wallet, currencyRecord);
            }
            if (addAddrs.length > 0) {
                addrs = addrs.concat(addAddrs);
                updateStore('addrs', addrs);
            }
            currencyRecord.updateAddr = true;
            updateStore('walletList', walletList);
        }
    }

    /**
     * 解析交易详情
     */
    private parseTransactionDetails(addr: string, currencyName: string) {
        if (ERC20Tokens[currencyName]) {
            this.parseEthERC20TokenTransactionDetails(addr, currencyName);

            return;
        }
        switch (currencyName) {
            case 'ETH': this.parseEthTransactionDetails(addr); break;
            case 'BTC': this.parseBtcTransactionDetails(addr); break;
            default:
        }

    }

    private async parseEthERC20TokenTransactionDetails(addr: string, currencyName: string) {
        const api = new EthApi();
        const contractAddress = ERC20Tokens[currencyName].contractAddr;
        try{
            const res = await api.getTokenTransferEvents(contractAddress, addr);
            console.log('parseEthERC20TokenTransactionDetails-=-=-=-=-=-',res);
            const list = [];
            const transactions = find('transactions') || [];
            res.result.forEach(v => {
                if (transactions.some(v1 => (v1.hash === v.hash) && (v1.addr === addr) && (v1.currencyName === currencyName))) return;
                // 移除缓存记录
                this.removeRecordAtAddr(addr, v.hash);
                // info--input  0x636573--ces
    
                const record = {
                    hash: v.hash,
                    from: v.from,
                    to: v.to,
                    value: parseFloat(v.value),
                    fees: parseFloat(v.gasUsed) * parseFloat(v.gasPrice),
                    time: parseInt(v.timeStamp, 10) * 1000,
                    info: '',
                    currencyName,
                    addr
                };
                list.push(record);
            });
            if (list.length > 0) {
                this.setTransactionLocalStorage(transactions.concat(list));
            }
        }catch(err){
            console.log('parseEthERC20TokenTransactionDetails------',err);
        }
        
    }
    private async parseEthTransactionDetails(addr: string) {
        const api = new EthApi();
        const r: any = await api.getAllTransactionsOf(addr);
        const ethTrans = this.filterEthTrans(r.result);
        const list = [];
        // const hashList = [];
        const transactions = find('transactions') || [];
        ethTrans.forEach(v => {
            api.getBlockNumber().then(console.log);
            api.getTransaction(v.hash).then(console.log);
            if (transactions.some(v1 => (v1.hash === v.hash) && (v1.addr === addr))) return;
            // 移除缓存记录
            this.removeRecordAtAddr(addr, v.hash);
            // info--input  0x636573--ces

            const record:TransRecordLocal = {
                hash: v.hash,
                from: v.from,
                to: v.to,
                value: parseFloat(v.value),
                fees: parseFloat(v.gasUsed) * parseFloat(v.gasPrice),
                time: parseInt(v.timeStamp, 10) * 1000,
                info: '',
                currencyName: 'ETH',
                addr: addr
            };
            list.push(record);
            // hashList.push(v.hash);
            
        });
        if (list.length > 0) {
            this.setTransactionLocalStorage(transactions.concat(list));
        }
    }
    // 过滤eth交易记录，过滤掉token的交易记录
    private filterEthTrans(trans: any[]) {

        return trans.filter(item => {
            if (item.to.length === 0) return false;
            if (item.input.indexOf(ethTokenTransferCode) === 0) return false;

            return true;
        });

    }
    private async parseBtcTransactionDetails(addr: string) {
        // return;
        // const info = await BtcApi.getAddrInfo(addr);
        const info = await BtcApi.getAddrTxHistory(addr);
        if (!info) return;
        // const num = sat2Btc(info.balance);
        // this.setBalance(addr, 'BTC',num);

        // console.log('getAddrInfo', info);
        if (info.txs) {
            const transactions = find('transactions') || [];
            const list = [];

            info.txs.forEach(v => {
                if (transactions.some(v1 => (v1.hash === v.txid) && (v1.addr === addr))) return;
                if (v.confirmations < DataCenter.LIMIT_CONFIRMATIONS) return;
                this.removeRecordAtAddr(addr, v.txid);
                list.push(this.parseBtcTransactionTxRecord(addr, v));
            });
            if (list.length > 0) {
                this.setTransactionLocalStorage(transactions.concat(list));
            }
        }
    }

    /**
     * 解析btc交易详情记录
     */
    private parseBtcTransactionTxRecord(addr: string, tx: any) {
        // console.log('parseBtcTransactionTxRecord', tx);
        let value = 0;
        const inputs = tx.vin.map(v => {
            return v.addr;
        });
        const outputs = tx.vout.map(v => {
            if (!value) {
                if (inputs.indexOf(addr) >= 0) {
                    value = parseFloat(v.value);
                } else if (addr === v.scriptPubKey.addresses[0]) {
                    value = parseFloat(v.value);
                }
            }

            return v.scriptPubKey.addresses[0];
        });

        return {
            addr: addr,
            currencyName: 'BTC',
            hash: tx.txid,
            time: tx.time * 1000,
            info: '',
            fees: btc2Sat(tx.fees),
            value: btc2Sat(value),
            inputs: inputs,
            outputs: outputs
        };
    }

    private removeRecordAtAddr(addr: string, hashStr: string) {
        let addrs = find('addrs') || [];
        let isUpdate = false;
        addrs = addrs.map(v => {
            if (v.addr !== addr) return v;
            const t = v.record.filter(v1 => v1.hash !== hashStr);
            if (v.record.length !== t.length) {
                isUpdate = true;
                v.record = t;
            }

            return v;
        });
        if (isUpdate) {
            updateStore('addrs', addrs);
        }
    }

    /**
     * 更新余额
     */
    private updateBalance(addr: string, currencyName: string) {
        if (ERC20Tokens[currencyName]) {
            const balanceOfCode = EthWallet.tokenOperations('balanceof', currencyName, addr);
            // console.log('balanceOfCode',balanceOfCode);
            const api = new EthApi();
            api.ethCall(ERC20Tokens[currencyName].contractAddr, balanceOfCode).then(r => {
                // tslint:disable-next-line:radix
                const num = ethTokenDivideDecimals(Number(r), currencyName);
                // console.log(currencyName,num);
                this.setBalance(addr, currencyName, num);
            });

            return;
        }
        switch (currencyName) {
            case 'ETH':
                const api = new EthApi();
                api.getBalance(addr).then(r => {
                    const num = wei2Eth(r.result);
                    this.setBalance(addr, currencyName, num);
                });
                break;
            case 'BTC':
                BtcApi.getBalance(addr).then(r => {
                    this.setBalance(addr, currencyName, sat2Btc(r));
                });
                break;
            default:
        }
    }

    /**
     * 设置余额
     */
    private setBalance(addr: string, currencyName: string, num: number) {
        let addrs = find('addrs') || [];

        let isUpdate = false;
        addrs = addrs.map(v => {
            if (v.addr === addr && v.currencyName === currencyName && v.balance !== num) {
                v.balance = num;
                isUpdate = true;
            }

            return v;
        });

        if (isUpdate) {
            updateStore('addrs', addrs);
        }
    }

    private async exchangeRate(currencyName: string) {
        switch (currencyName) {
            case 'ETH':
                const ethApi: EthApi = new EthApi();
                const ethRate = await ethApi.getExchangeRate();
                updateStore('exchangeRateJson', getBorn('exchangeRateJson').set('ETH', ethRate));
                break;
            case 'BTC':
                const btcRate = await BtcApi.getExchangeRate();
                updateStore('exchangeRateJson', getBorn('exchangeRateJson').set('BTC', btcRate));
                break;
            default:
        }

    }

    private setTransactionLocalStorage(transactions: any[], notify: boolean = false) {
        const addrs = find('addrs');
        const existedAddrs = [];
        addrs.forEach(addr => existedAddrs.push(addr.addr));
        const trans = transactions.filter(trans => existedAddrs.indexOf(trans.addr) >= 0);
        updateStore('transactions', trans);
    }

    /**
     * 检查eth地址
     */
    private async checkEthAddr(wallet: Wallet, currencyRecord: CurrencyRecord) {
        const mnemonic = await getMnemonic(wallet, '');
        const ethWallet = EthWallet.fromMnemonic(mnemonic, lang);
        const cnt = await ethWallet.scanUsedAddress();
        const addrs: Addr[] = [];

        for (let i = 1; i < cnt; i++) {
            const address = ethWallet.selectAddress(i);
            currencyRecord.addrs.push(address);
            addrs.push(initAddr(address, 'ETH'));
        }

        return addrs;
    }

    /**
     * 检查btc地址
     */
    private async checkBtcAddr(wallet: Wallet, currencyRecord: CurrencyRecord) {
        const mnemonic = await getMnemonic(wallet, '');
        const btcWallet = BTCWallet.fromMnemonic(mnemonic, btcNetwork, lang);
        btcWallet.unlock();
        const cnt = await btcWallet.scanUsedAddress();

        const addrs: Addr[] = [];

        for (let i = 1; i < cnt; i++) {
            const address = btcWallet.derive(i);
            currencyRecord.addrs.push(address);
            addrs.push(initAddr(address, 'BTC'));
        }
        btcWallet.lock();

        return addrs;
    }

    /**
     * 检查eth erc20 token地址
     */
    private async checkEthERC20TokenAddr(wallet: Wallet, currencyRecord: CurrencyRecord) {
        const mnemonic = await getMnemonic(wallet, '');
        const ethWallet = EthWallet.fromMnemonic(mnemonic, lang);
        const cnt = await ethWallet.scanTokenUsedAddress(ERC20Tokens[currencyRecord.currencyName].contractAddr);
        const addrs: Addr[] = [];

        for (let i = 1; i < cnt; i++) {
            const address = ethWallet.selectAddress(i);
            currencyRecord.addrs.push(address);
            addrs.push(initAddr(address, currencyRecord.currencyName));
        }

        return addrs;
    }

}

// ============================================ 立即执行
/**
 * 消息处理列表
 */
export const dataCenter: DataCenter = new DataCenter();