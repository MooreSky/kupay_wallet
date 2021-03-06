<div w-class="historylist" id="historylist" on-scroll="getMoreList">

    <div w-class="history">
        <div w-class="item">
            <span w-class="itemRank">{{it.myRank}}</span>
            <img src="../../../res/image/addMine_create.png" w-class="itemImg"/>
            <div style="display: inline-block;flex: 1 0 0;">
                <div w-class="itemName">{{it1.cfgData.me}}</div>
                {{if it.fg==1}}
                <div w-class="itemDescribe">{{it1.cfgData.leftTitle + it1.totalNum+" "}} KT</div>
                {{else}}
                <div w-class="itemDescribe">{{it1.cfgData.rightTitle + it1.totalNum+" "}} KT</div>
                {{end}}
            </div>
        </div>
        {{for ind,val of it1.data}}
            {{let desc = it.fg==1? it1.cfgData.leftTitle : it1.cfgData.rightTitle}}
            {{let rank = val.index}}
            
            {{if rank<10}}
                {{: rank="00"+rank}}
            {{elseif rank<100}}
                {{: rank="0"+rank}}
            {{end}}
            <app-components-imgRankItem-imgRankItem>{"name":{{val.name}},"describe":{{desc+val.num+" KT"}},"img":{{val.avatar?val.avatar:"../../res/image/addMine_create.png"}},"rank":{{rank}} }</app-components-imgRankItem-imgRankItem>
        {{end}}

        {{if it1.data.length>0 && !it1.more}}
        <div w-class="endMess">{{it1.cfgData.tips[0]}}^_^</div>
        {{end}}

        {{if it1.data.length==0}}
        <div w-class="historyNone">
            <img src="../../../res/image/dividend_history_none.png" style="width: 200px;height: 200px;"/>
            <div>{{it1.cfgData.tips[1]}}</div>
        </div>
        {{end}}
    </div>    
    
</div>