<div ng-attr-style="width:{{node.w}}px;height:{{node.h}}px;">
    <div style="position:relative">
        <svg ng-attr-width="{{ node.w }}" ng-attr-height="{{ node.h }}">
            <ellipse ng-attr-cx="{{ node.w/2 }}" ng-attr-cy="{{ node.h/2 }}" ng-attr-rx="{{ (node.w/2) - 10 }}" ng-attr-ry="{{ (node.h/2) - 10 }}" class="inner"/>
            <text text-anchor="middle" ng-attr-x="{{ node.w / 2 }}" ng-attr-y="{{ node.h / 2 }}" dominant-baseline="central">{{node.text}}</text>
        </svg>
    </div>
</div>
<jtk-source port-type="start" filter=".outer" filter-negate="true"></jtk-source>