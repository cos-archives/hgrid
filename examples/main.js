require.config({
  paths: {
    'jQuery': '../lib/jquery-1.10.2',
    'hgrid': '../dist/hgrid'
  },
  shim: {
    'jQuery': {
      exports: '$'
    },
    'hgrid': {
      deps: ['jQuery']
    }
  }
});

require(['jQuery', 'hgrid'], function($, HGrid) {
  var myData = [{
        name: 'My Computer',
        kind: 'folder',
        children: [{
          name: 'My Documents',
          kind: 'folder',
          children: [{
            name: 'Scripts',
            kind: 'folder',
            children: [{
              name: 'foo.py',
              kind: 'item'
            }]
          }]
        }]
      }
  ];

  var grid = new HGrid('#myGrid', {data: myData, width: 500});
});
