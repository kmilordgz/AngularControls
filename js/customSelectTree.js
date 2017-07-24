var esMovil = {
    Android: function () {
        return navigator.userAgent.match(/Android/i);
    },
    BlackBerry: function () {
        return navigator.userAgent.match(/BlackBerry/i);
    },
    iOS: function () {
        return navigator.userAgent.match(/iPhone|iPad|iPod/i);
    },
    Opera: function () {
        return navigator.userAgent.match(/Opera Mini/i);
    },
    Windows: function () {
        return navigator.userAgent.match(/IEMobile/i);
    },
    otro: function () {
        return navigator.userAgent.match(/Mobile/i);
    },
    Cualquiera: function () {
        return esMovil.Android() || esMovil.BlackBerry() || esMovil.iOS() || esMovil.Opera() || esMovil.Windows() || esMovil.otro();
    }
};
(function (angular, undefined) {
    'use strict';

    // TODO: Move to polyfill?
    if (!String.prototype.trim) {
        String.prototype.trim = function () {
            return this.replace(/^\s+|\s+$/g, '');
        };
    }

    /**
	 * A replacement utility for internationalization very similar to sprintf.
	 *
	 * @param replace {mixed} The tokens to replace depends on type
	 *  string: all instances of $0 will be replaced
	 *  array: each instance of $0, $1, $2 etc. will be placed with each array item in corresponding order
	 *  object: all attributes will be iterated through, with :key being replaced with its corresponding value
	 * @return string
	 *
	 * @example: 'Hello :name, how are you :day'.format({ name:'John', day:'Today' })
	 * @example: 'Records $0 to $1 out of $2 total'.format(['10', '20', '3000'])
	 * @example: '$0 agrees to all mentions $0 makes in the event that $0 hits a tree while $0 is driving drunk'.format('Bob')
	 */
    function format(value, replace) {
        if (!value) {
            return value;
        }
        var target = value.toString();
        if (replace === undefined) {
            return target;
        }
        if (!angular.isArray(replace) && !angular.isObject(replace)) {
            return target.split('$0').join(replace);
        }
        var token = angular.isArray(replace) && '$' || ':';

        angular.forEach(replace, function (value, key) {
            target = target.split(token + key).join(value);
        });
        return target;
    }

    var module = angular.module('SelectTreeAR', ['ngSanitize']);

    module.value('customSelectDefaults', {
        displayText: 'Seleccione',
        emptyListText: 'No se han encontrado resultados para tu búsqueda ',
        emptySearchResultText: 'No se han encontrado resultados para tu búsqueda "$0"',        
        searchDelay: 300,
        iconLeaf: null,
        iconExpand: null,
        iconCollapse: null,
        fieldChildren: null,
        expanded: null,
        orderByField: null,
        orderByReverse: false,
		textSearch: "Search.."
    });

    module.directive('customSelectTree', ['$parse', '$compile', '$timeout', '$q', 'customSelectDefaults', function ($parse, $compile, $timeout, $q, baseOptions) {
        var CS_OPTIONS_REGEXP = /^\s*(.*?)(?:\s+as\s+(.*?))?\s+for\s+(?:([\$\w][\$\w\d]*))\s+in\s+(.*)$/;

        return {
            restrict: 'A',
            require: 'ngModel',
            link: function (scope, elem, attrs, controller) {
                var customSelect = attrs.customSelectTree;
                if (!customSelect) {
                    throw new Error('Expected custom-select-tree attribute value.');
                }

                var match = customSelect.match(CS_OPTIONS_REGEXP);

                if (!match) {
                    throw new Error("Expected expression in form of " +
						"'_select_ (as _label_)? for _value_ in _collection_'" +
						" but got '" + customSelect + "'.");
                }

                elem.addClass('dropdown custom-select-tree');

                // Ng-Options break down
                var displayFn = $parse(match[2] || match[1]),
					valueName = match[3],
					valueFn = $parse(match[2] ? match[1] : valueName),
					values = match[4],
					valuesFn = $parse(values),
					dependsOn = attrs.csDependsOn;

                var options = getOptions(),
					timeoutHandle,
					lastSearch = '',
					focusedIndex = -1,
						matchMap = {};

                if (options.iconExpand == null || options.iconExpand == undefined) {
                    options.iconExpand = 'icon-plus  glyphicon glyphicon-plus  fa fa-plus';
                }
                if (options.iconCollapse == null || options.iconCollapse == undefined) {
                    options.iconCollapse = 'icon-minus glyphicon glyphicon-minus fa fa-minus';
                }
                if (options.iconLeaf == null || options.iconLeaf == undefined) {
                    options.iconLeaf = 'icon-file  glyphicon glyphicon-file  fa fa-file';
                }                
                if (options.orderByField == null || options.orderByField == undefined) {
                    options.orderByField = '3';
                }
                if (options.orderByReverse == null || options.orderByReverse == undefined) {
                    options.orderByReverse = false;
                }

                var itemTemplate = elem.html().trim() || (match[2] || match[1]),

					dropdownTemplate =
					'<a class="dropdown-toggle" data-toggle="dropdown" href ng-class="{ disabled: disabled }">' +
                        '<span><div ng-bind-html="displayText"></div></span>' +
						'<span class="new" ng-hide="valueFn(childScope, locals)==\'-1\'?false:true">Nuevo</span><b></b>' +
					'</a>' +
					'<div class="dropdown-menu customSelectTreeDropdownMenuTree">' +
						'<div stop-propagation="click" class="custom-select-tree-search">' +
						'<input class="form-control ' + attrs.selectClass + '" type="text" placeholder="'+options.textSearch+'" autocomplete="off" ng-model="searchTerm" />' +
						'</div>' +                       
						'<ul role="menu">' +
							'<li role="presentation" ng-repeat="' + valueName + ' in matches | orderBy : \'' + options.orderByField + '\' : ' + options.orderByReverse + '">' +
								'<a role="menuitem" tabindex="-1" >' +
                                    '<i ng-click="expandCollapse(' + valueName + ')" ng-class="getClass(' + valueName + ')">&nbsp;</i>' +
                                    '<label style="width: 90%; font-weight: normal; margin: 0px; cursor: pointer; display: -webkit-inline-box;" ng-click="select(' + valueName + ')"  ng-bind-html="' + itemTemplate + '"></label>' +
								'</a>' +
                                '<ul role="menu" ng-show="' + valueName + '.' + options.expanded + '">' +
                                    '<li role="presentation" ng-repeat="' + valueName + ' in ' + valueName + '.' + options.fieldChildren + ' | orderBy : \'' + options.orderByField + '\' : ' + options.orderByReverse + '">' +
								       '<a role="menuitem" tabindex="-1" >' +
                                            '<i ng-click="expandCollapse(' + valueName + ')" ng-class="getClass(' + valueName + ')">&nbsp;</i>' +
                                            '<label style="width: 90%; font-weight: normal; margin: 0px; cursor: pointer; display: -webkit-inline-box;" ng-click="select(' + valueName + ')"  ng-bind-html="' + itemTemplate + '"></label>' +
								        '</a>' +
                                        '<ul role="menu" ng-show="' + valueName + '.' + options.expanded + '">' +
                                            '<li role="presentation" ng-repeat="' + valueName + ' in ' + valueName + '.' + options.fieldChildren + ' | orderBy : \'' + options.orderByField + '\' : ' + options.orderByReverse + '">' +
								               '<a role="menuitem" tabindex="-1" >' +
                                                    '<i ng-click="expandCollapse(' + valueName + ')" ng-class="getClass(' + valueName + ')">&nbsp;</i>' +
                                                    '<label style="width: 90%; font-weight: normal; margin: 0px; cursor: pointer; display: -webkit-inline-box;" ng-click="select(' + valueName + ')"  ng-bind-html="' + itemTemplate + '"></label>' +
								                '</a>' +
                                                '<ul role="menu" ng-show="' + valueName + '.' + options.expanded + '">' +
                                                    '<li role="presentation" ng-repeat="' + valueName + ' in ' + valueName + '.' + options.fieldChildren + ' | orderBy : \'' + options.orderByField + '\' : ' + options.orderByReverse + '">' +
								                       '<a role="menuitem" tabindex="-1" >' +
                                                            '<i ng-click="expandCollapse(' + valueName + ')" ng-class="getClass(' + valueName + ')">&nbsp;</i>' +
                                                            '<label style="width: 90%; font-weight: normal; margin: 0px; cursor: pointer; display: -webkit-inline-box;" ng-click="select(' + valueName + ')"  ng-bind-html="' + itemTemplate + '"></label>' +
								                        '</a>' +
                                                        '<ul role="menu" ng-show="' + valueName + '.' + options.expanded + '">' +
                                                            '<li role="presentation" ng-repeat="' + valueName + ' in ' + valueName + '.' + options.fieldChildren + ' | orderBy : \'' + options.orderByField + '\' : ' + options.orderByReverse + '">' +
								                               '<a role="menuitem" tabindex="-1" >' +
                                                                    '<i ng-click="expandCollapse(' + valueName + ')" ng-class="getClass(' + valueName + ')">&nbsp;</i>' +
                                                                    '<label style="width: 90%; font-weight: normal; margin: 0px; cursor: pointer; display: -webkit-inline-box;" ng-click="select(' + valueName + ')"  ng-bind-html="' + itemTemplate + '"></label>' +
								                                '</a>' +
                                                                '<ul role="menu" ng-show="' + valueName + '.' + options.expanded + '">' +
                                                                    '<li role="presentation" ng-repeat="' + valueName + ' in ' + valueName + '.' + options.fieldChildren + ' | orderBy : \'' + options.orderByField + '\' : ' + options.orderByReverse + '">' +
								                                       '<a role="menuitem" tabindex="-1" >' +
                                                                            '<i ng-click="expandCollapse(' + valueName + ')" ng-class="getClass(' + valueName + ')">&nbsp;</i>' +
                                                                            '<label style="width: 90%; font-weight: normal; margin: 0px; cursor: pointer; display: -webkit-inline-box;" ng-click="select(' + valueName + ')"  ng-bind-html="' + itemTemplate + '"></label>' +
								                                        '</a>' +
							                                        '</li>' +
                                                                '</ul>' +
							                                '</li>' +
                                                        '</ul>' +
							                        '</li>' +
                                                '</ul>' +
							                '</li>' +
                                        '</ul>' +
							        '</li>' +
                                '</ul>' +
							'</li>' +
							'<li ng-hide="matches.length" class="empty-result" stop-propagation="click">' +
								'<em class="muted">' +
									'<span ng-hide="searchTerm">{{emptyListText}}</span>' +
									'<span class="word-break" ng-show="searchTerm">{{ format(emptySearchResultText, searchTerm) }}</span>' +
								'</em>' +
							'</li>' +
						'</ul>' +
						'<div class="custom-select-tree-action">' +
							(typeof options.onAdd === "function" ?
							'<button type="button" class="btn btn-success btn-block add-button" ng-click="add(searchTerm)">{{addText}}</button>' : '') +
						'</div>' +
					'</div>';

                // Clear element contents
                elem.empty();

                // Create dropdown element
                var dropdownElement = angular.element(dropdownTemplate),
					anchorElement = dropdownElement.eq(0).dropdown(),
					inputElement = dropdownElement.eq(1).find(':text'),
					ulElement = dropdownElement.eq(1).find('ul');

                // Create child scope for input and dropdown
                var childScope = scope.$new(true);
                configChildScope();

                // Click event handler to set initial values and focus when the dropdown is shown
                anchorElement.on('click', function (event) {
                    if (childScope.disabled) {
                        return;
                    }
                    childScope.$apply(function () {
                        lastSearch = '';
                    });
                    focusedIndex = -1;
                    if (!(esMovil.Cualquiera())) {
                        inputElement.focus();
                    }                  
                    // If filter is not async, perform search in case model changed
                    if (!options.async) {
                        getMatches('');
                    }
                });

                if (dependsOn) {
                    scope.$watch(dependsOn, function (newVal, oldVal) {
                        if (newVal !== oldVal) {
                            childScope.matches = [];
                            //childScope.select(undefined);
                            getMatches('');
                        }
                    });
                }

                // Event handler for key press (when the user types a character while focus is on the anchor element)
                anchorElement.on('keypress', function (event) {
                    if (!(event.altKey || event.ctrlKey)) {
                        anchorElement.click();
                    }
                });

                // Event handler for Esc, Enter, Tab and Down keys on input search
                inputElement.on('keydown', function (event) {
                    if (!/(13|27|40|^9$)/.test(event.keyCode)) return;
                    event.preventDefault();
                    event.stopPropagation();

                    switch (event.keyCode) {
                        case 27: // Esc
                            anchorElement.dropdown('toggle');
                            break;
                        case 13: // Enter
                            selectFromInput();
                            break;
                        case 40: // Down
                            focusFirst();
                            break;
                        case 9:// Tab
                            anchorElement.dropdown('toggle');
                            break;
                    }
                });

                // Event handler for Up and Down keys on dropdown menu
                ulElement.on('keydown', function (event) {
                    if (!/(38|40)/.test(event.keyCode)) return;
                    event.preventDefault();
                    event.stopPropagation();

                    var items = ulElement.find('li > a');

                    if (!items.length) return;
                    if (event.keyCode == 38) focusedIndex--;                                    // up
                    if (event.keyCode == 40 && focusedIndex < items.length - 1) focusedIndex++; // down
                    //if (!~focusedIndex) focusedIndex = 0;

                    if (focusedIndex >= 0) {
                        items.eq(focusedIndex)
							.focus();
                    } else {
                        focusedIndex = -1;
                        inputElement.focus();
                    }
                });

                resetMatches();

                // Compile template against child scope
                $compile(dropdownElement)(childScope);
                elem.append(dropdownElement);

                // When model changes outside of the control, update the display text
                controller.$render = function () {
                    setDisplayText();
                };

                // Watch for changes in the default display text
                childScope.$watch(getDisplayText, setDisplayText);

                childScope.$watch(function () { return elem.attr('disabled'); }, function (value) {
                    childScope.disabled = value;
                });

                childScope.$watch('searchTerm', function (newValue) {
                    if (timeoutHandle) {
                        $timeout.cancel(timeoutHandle);
                    }

                    var term = (newValue || '').trim();
                    timeoutHandle = $timeout(function () {
                        getMatches(term);
                    },
					// If empty string, do not delay
					(term && options.searchDelay) || 0);
                });

                // Support for autofocus
                if ('autofocus' in attrs) {
                    anchorElement.focus();
                }

                var needsDisplayText;
                function setDisplayText() {
                    var locals = {};
                    locals[valueName] = controller.$modelValue;
                    var text = displayFn(scope, locals);

                    if (text === undefined) {
                        var map = matchMap[hashKey(controller.$modelValue)];
                        if (map) {
                            text = map.label;
                        }
                    }

                    needsDisplayText = !text;
                    childScope.displayText = text || options.displayText;
                }

                function getOptions() {
                    return angular.extend({}, baseOptions, scope.$eval(attrs.customSelectOptions));
                }

                function getDisplayText() {
                    options = getOptions();
                    return options.displayText;
                }

                function focusFirst() {
                    var opts = ulElement.find('li > a');
                    if (opts.length > 0) {
                        focusedIndex = 0;
                        opts.eq(0).focus();
                    }
                }

                // Selects the first element on the list when the user presses Enter inside the search input
                function selectFromInput() {
                    var opts = ulElement.find('li > a');
                    if (opts.length > 0) {
                        var ngRepeatItem = opts.eq(0).scope();
                        var item = ngRepeatItem[valueName];
                        childScope.$apply(function () {
                            childScope.select(item);
                        });
                        anchorElement.dropdown('toggle');
                    }
                }

                function getMatches(searchTerm) {
                    var locals = { $searchTerm: searchTerm }
                    $q.when(valuesFn(scope, locals)).then(function (matches) {
                        if (!matches) return;

                        if (searchTerm === inputElement.val().trim()/* && hasFocus*/) {
                            matchMap = {};
                            childScope.matches.length = 0;
                            angular.forEach(matches, function (value1, key) {
                                locals[valueName] = value1;
                                var value = valueFn(scope, locals),
									label = displayFn(scope, locals);
                                matchMap[hashKey(value)] = {
                                    value: value,
                                    label: label/*,
									model: matches[i]*/
                                };
                                angular.forEach(value1[options.fieldChildren], function (value2, key) {
                                    locals[valueName] = value2;
                                    var value = valueFn(scope, locals),
                                        label = displayFn(scope, locals);
                                    matchMap[hashKey(value)] = {
                                        value: value,
                                        label: label/*,
									    model: matches[i]*/
                                    };
                                    angular.forEach(value2[options.fieldChildren], function (value3, key) {
                                        locals[valueName] = value3;
                                        var value = valueFn(scope, locals),
                                            label = displayFn(scope, locals);
                                        matchMap[hashKey(value)] = {
                                            value: value,
                                            label: label/*,
									        model: matches[i]*/
                                        };
                                        angular.forEach(value3[options.fieldChildren], function (value4, key) {
                                            locals[valueName] = value4;
                                            var value = valueFn(scope, locals),
                                                label = displayFn(scope, locals);
                                            matchMap[hashKey(value)] = {
                                                value: value,
                                                label: label/*,
									            model: matches[i]*/
                                            };
                                            angular.forEach(value4[options.fieldChildren], function (value5, key) {
                                                locals[valueName] = value5;
                                                var value = valueFn(scope, locals),
                                                    label = displayFn(scope, locals);
                                                matchMap[hashKey(value)] = {
                                                    value: value,
                                                    label: label/*,
									                 model: matches[i]*/
                                                };
                                                angular.forEach(value5[options.fieldChildren], function (value6, key) {
                                                    locals[valueName] = value6;
                                                    var value = valueFn(scope, locals),
                                                        label = displayFn(scope, locals);
                                                    matchMap[hashKey(value)] = {
                                                        value: value,
                                                        label: label/*,
									                     model: matches[i]*/
                                                    };
                                                });
                                            });
                                        });
                                    });
                                });
                                childScope.matches.push(value1);
                            });                            
                            //childScope.matches = matches;
                        }

                        if (needsDisplayText) setDisplayText();
                    }, function () {
                        resetMatches();
                    });
                }

                function resetMatches() {
                    childScope.matches = [];
                    focusedIndex = -1;
                };

                function configChildScope() {
                    childScope.addText = options.addText;
                    childScope.emptySearchResultText = options.emptySearchResultText;
                    childScope.emptyListText = options.emptyListText;

                    childScope.select = function (item) {
                        var locals = {};
                       
                        locals[valueName] = item;
                        var value = valueFn(childScope, locals);
                        //setDisplayText(displayFn(scope, locals));
                        childScope.displayText = displayFn(childScope, locals) || options.displayText;
                        controller.$setViewValue(value);

                        anchorElement.focus();
                        inputElement.val("");
                        typeof options.onSelect === "function" && options.onSelect(item);
                    };

                    childScope.expandCollapse = function (item) {
                        if (item[options.expanded] != null) {
                            item[options.expanded] = item[options.expanded] ? false : true;
                            $('.customSelectTreeDropdownMenuTree').dropdown('toggle');
                        }
                    };

                    childScope.getClass = function (item) {
                        if (item[options.fieldChildren] != null) {
                            if (item[options.fieldChildren].length == 0) {
                                return options.iconLeaf;
                            } else if (item[options.expanded]) {
                                return options.iconCollapse;
                            } else if (!item[options.expanded]) {
                                return options.iconExpand;
                            }
                        }
                    };

                    childScope.add = function (searchTerm) {                        
                            $q.when(options.onAdd(searchTerm), function (item) {
                                if (!item) return;
                                var locals = {};
                                locals[valueName] = item;
                                var value = valueFn(scope, locals),
                                    label = displayFn(scope, locals);
                                matchMap[hashKey(value)] = {
                                    value: value,
                                    label: label/*,
									model: matches[i]*/
                                };
                                childScope.matches.push(item);
                                childScope.select(item);
                            });                        
                    };

                    childScope.format = format;

                    setDisplayText();
                }

                var current = 0;
                function hashKey(obj) {
                    if (obj === undefined) return 'undefined';

                    var objType = typeof obj,
						key;

                    if (objType == 'object' && obj !== null) {
                        if (typeof (key = obj.$$hashKey) == 'function') {
                            // must invoke on object to keep the right this
                            key = obj.$$hashKey();
                        } else if (key === undefined) {
                            key = obj.$$hashKey = 'cs-' + (current++);
                        }
                    } else {
                        key = obj;
                    }

                    return objType + ':' + key;
                }
            }
        };
    }]);

    module.directive('stopPropagation', function () {
        return {
            restrict: 'A',
            link: function (scope, elem, attrs, ctrl) {
                var events = attrs['stopPropagation'];
                elem.bind(events, function (event) {
                    event.stopPropagation();
                });
            }
        };
    });
})(angular);
