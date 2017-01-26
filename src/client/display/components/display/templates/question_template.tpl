<div ng-attr-style="width:{{node.w}}px;height:{{node.h}}px;">
    <svg ng-attr-width="{{node.w}}" ng-attr-height="{{node.h}}">
        <path ng-attr-d="M {{node.w/2}} 10 L {{node.w-10}} {{node.h/2}} L {{node.w/2}} {{node.h-10}} L 10 {{node.h/2}} Z" class="inner"/>
        <text text-anchor="middle" ng-attr-x="{{node.w/2}}" ng-attr-y="{{node.h/2}}" dominant-baseline="central">{{node.text}}</text>
    </svg>
</div>
<jtk-source port-type="source" filter=".outer"></jtk-source>
<jtk-target port-type="target"></jtk-target>