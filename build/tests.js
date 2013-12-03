test( "Create", function() {
    ok( myGrid, "pass");
});

test( "Data Length in Grid", function(){
    equal( myGrid.data.length, data.length, "pass");
});