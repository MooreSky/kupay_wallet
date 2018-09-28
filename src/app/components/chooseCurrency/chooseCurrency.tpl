<div w-class="body" class="new-page" ev-back-click="backClick">
    <div w-class="top"></div>
    <div w-class="bottom">
        <div w-class="title">
            <div style="margin-left: 50px;">{{it1.cfgData.selectCoin}}</div>
            <img src="../../res/image/30_gray.png" w-class="close" on-tap="close"/>
        </div>
        <div style="overflow-x: hidden;overflow-y: auto;height: 100%;">
            {{for ind,val of it1.currencyShowList}}
            <div w-class="new-code" on-tap="changeSelect(e,{{ind}})">
                <img src={{val.img}} style="width: 50px;height: 50px;"/>
                <span w-class="prepend">{{val.name}}</span>
                <span w-class="append" style="margin-right: {{it1.selected==ind?'20px':'60px'}}">{{val.balance}}</span>
                {{if it1.selected==ind}}
                <img src="../../res/image/16.png" style="width: 40px;height: 40px;"/>
                {{end}}
            </div>
            {{end}}
        </div>
    </div>
</div>