<div class="new-page" ev-back-click="backPrePage">
    <app-components1-topBar-topBar>{title:{{it1.cfgData.topBarTitle}},background:"#fff"}</app-components1-topBar-topBar>
    <div w-class="body">
        <div w-class="head-container" class="pi-input">
            <img w-class="avatar" src="{{it1.avatar}}" on-tap="uploadAvatar"/>
            <div style="flex: 1 0 0;" ev-input-blur="walletNameInputBlur" ev-input-change="walletNameInputChange">
                <app-components1-input-input>{input:{{it1.nickName}},maxLength:10,autofocus:true,placeHolder:{{it1.cfgData.defaultName}},disabled:{{!it1.userInput}} }</app-components1-input-input>
            </div>
            <img src="../../../res/image/edit_blue.png" w-class="edit" on-tap="changeInput"/>
            
        </div>
        <div w-class="other">
            <div on-tap="changePhone">
                {{if it1.phone.indexOf('*') > 0}}
                <div w-class="other-item" ev-switch-click="onSwitchChange">
                    <span w-class="item-title">{{it1.cfgData.itemTitle[0]}}</span>
                    <span w-class="tag">{{it1.phone}}</span>
                </div>
                {{else}}
                <app-components-basicItem-basicItem>{name:{{it1.cfgData.itemTitle[0]}},describe:{{it1.phone}}}</app-components-basicItem-basicItem>
                {{end}}
            </div>
            <div on-tap="changePsw">
                <app-components-basicItem-basicItem>{name:{{it1.cfgData.itemTitle[1]}},style:"margin:0;border:none;"}</app-components-basicItem-basicItem>
            </div>
        </div>
        <div w-class="other">
            <div w-class="other-item" on-tap="backupWalletClick">
                <div w-class="item-title">{{it1.cfgData.itemTitle[2]}}</div>
                {{if !it1.backup}}
                <div w-class="tag">{{it1.cfgData.itemTitle[3]}}</div>
                {{end}}
                <img src="../../../res/image/right_arrow_blue.png" w-class="rightArrow"/>
            </div>
            <div w-class="other-item" on-tap="exportPrivateKeyClick">
                <div w-class="item-title">{{it1.cfgData.itemTitle[4]}}</div>
                <img src="../../../res/image/right_arrow_blue.png" w-class="rightArrow"/>
            </div>
        </div>
    </div>
</div>