# AngularJS Custom Select Tree Directive

Es una modificación del plugin AngularCustomSelect de https://github.com/axel-zarate/js-custom-select
es la misma documetacion a continuacion dejo la forma de implementarlo

### Example image

<img src="https://github.com/kmilordgz/AngularCustomSelectTree/blob/master/Captura.PNG" />


### Complex objects

```HTML
<div custom-select-tree="item.Nombre as item.Nombre for item in searchCiudades($searchTerm)" ng-model="state" custom-select-options="ddlSearchCiudades"></div>
```
### Estructure JSON

```JS
$scope.states = [
{ 
  "__children__":[
	{ 
	  "__children__":[
		{ 
		  "__children__":[
			{ 
			  "__children__":[],
			  "__expanded__":false,
			  "Nombre":"Cruz 1", 
			}
		  ],
		  "__expanded__":false,
		  "Nombre":"Cruz", 
		}
	 ],
	  "__expanded__":false,
	  "Nombre":"Candelaria", 
	},
	{ 
	  "__children__":[],
	  "__expanded__":false,
	  "Nombre":"Luruaco"
	},
	{ 
	  "__children__":[],
	  "__expanded__":false,
	  "Nombre":"Puerto Colombia", 
	},
	{ 
	  "__children__":[],
	  "__expanded__":false,
	  "Nombre":"Santa Lucia", 
	}
 ],
  "__expanded__":false,
  "Nombre":"Atlántico", 
}                       
];
```
### Custom options

```JS
 $scope.ddlSearchCiudades = {
	iconLeaf: "fa fa-map-marker",
	iconExpand: "fa fa-plus",
	iconCollapse: "fa fa-minus",
	fieldChildren: "__children__",
	expanded: "__expanded__",
	orderByField: "Nombre",
	orderByReverse: false,
	async: true,
	textSearch: "Buscar,,,",
	onSelect: function(item){
		//select item object
	}
};
```


## Options
Name | Type | Details
---- | ---- | -------
displayText | String | Placeholder text to display in the select box when there is no item is selected. Default: `'Select...'`.
emptyListText | String | Message to display in the dropdown when there source array is empty. Default: `'There are no items to display'`.
emptySearchResultText | String | Message to display in the dropdown when the search filter yields zero results (the difference with `emptyListText` is that there may be items in the data source, but none of them match the search string). Default: `'No results match "$0"'`.
addText | String | Text to display on the add button; additionally, `onAdd` callback function must be supplied. Default: `'Add'`.
onAdd | Function | A callback function to execute when the Add button is pressed. Default: `undefined`.
searchDelay | Integer | Time in milliseconds to wait until the filtering is performed. Default: `300` (0.3 seconds).
onSelect | Function | Callback function invoked when the user selects an item from the dropdown.
async | Boolean | Indicates whether the search filter is asynchronous or not; setting this option to `true` will limit the number of times the search function is evaluated (it will only run when the user types something in the search box).

## Additional attributes
Name | Details
---- | -------
cs-depends-on | Used to specify a scope variable to listen for changes. When a change is detected, the selected value and matches in the directive (if any) are reset. Useful for cascading select elements (like country/state/city) or any other scenario where you need to force item and/or filter evaluation.

### Changing options globally
The configuration options can be set per directive instance but also globally by means of `customSelectDefaults`. You can override the default options at some point in your application (usually the module's `run` callback or in a localization file):

```JS
var app = angular.module('myApp');
app.run(['customSelectDefaults', function(customSelectDefaults) {
	customSelectDefaults.displayText = 'Seleccionar...';
	customSelectDefaults.emptyListText = 'No hay resultados';
	customSelectDefaults.emptySearchResultText = 'Ningún resultado para "$0"';
	customSelectDefaults.addText = 'Agregar';
	customSelectDefaults.searchDelay = 500;
	customSelectDefaults.iconLeaf = null;
        customSelectDefaults.iconExpand = null;
        customSelectDefaults.iconCollapse = null;
        customSelectDefaults.fieldChildren = null;
        customSelectDefaults.expanded = null;
        customSelectDefaults.orderByField = null;
        customSelectDefaults.orderByReverse = false;
	customSelectDefaults.textSearch = "Search..";
}]);
```
## Dependencies
* jQuery
* AngularJS
* Angular sanatize JS
* Font Awesome
* Twitter Bootstrap (2.x or 3.x)
