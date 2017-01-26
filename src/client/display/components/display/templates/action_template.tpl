<div ng-attr-style="width:{{node.w}}px;height:{{node.h}}px;">
    <div style="position:relative">
        <svg ng-attr-width="{{node.w}}" ng-attr-height="{{node.h}}">
            <rect x="10" y="10" ng-attr-width="{{node.w-20}}" ng-attr-height="{{node.h-20}}" class="inner"/>
            <text text-anchor="middle" ng-attr-x="{{node.w/2}}" ng-attr-y="{{node.h/2}}" dominant-baseline="central">{{node.text}}</text>
        </svg>
    </div>
    <span class="realtime-data">{{ node.sampleData }}</span>
    <jtk-target port-type="target"></jtk-target>
    <jtk-source port-type="source" filter=".outer"></jtk-source>
</div>