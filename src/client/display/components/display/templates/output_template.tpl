<div ng-attr-style="width:{{node.w}}px;height:{{node.h}}px;">
    <div style="position:relative">
        <svg ng-attr-width="{{node.w}}" ng-attr-height="{{node.h}}">
            <rect x="0" y="0" ng-attr-width="{{node.w}}" ng-attr-height="{{node.h}}"/>
            <text text-anchor="middle" ng-attr-x="{{node.w/2}}" ng-attr-y="{{node.h/2}}" dominant-baseline="central">{{node.text}}</text>
        </svg>
    </div>
</div>
<jtk-target port-type="target"></jtk-target>