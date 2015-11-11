(function() {
var _removeDefine = System.get("@@amd-helpers").createDefine();
define("VIA.Core.Templates", [], function() {
  return {"_overlay": "<div class=\"via_overlay\"> <div class=\"via_popupOverlay\"></div> <div class=\"via_popupWindow\"> <button class=\"viaIconCancel\"></button> </div> </div>"};
});
window.VIA = window.VIA || {};
if (!VIA.loadModule) {
  VIA.loadModule = function(globalName, method, moduleName, callback) {
    VIA[globalName] = {};
    VIA[globalName][method] = function() {
      var arg = arguments;
      window.document.addEventListener('VIA.' + globalName + ':onReady', function() {
        VIA[globalName][method](arg[0], arg[1]);
      });
    };
    System.amdRequire(moduleName, function(module) {
      callback(module);
      var e;
      if (typeof window.Event === 'function') {
        e = new window.Event('VIA.' + globalName + ':onReady');
      } else {
        e = window.document.createEvent('Event');
        e.initEvent('VIA.' + globalName + ':onReady', true, false);
      }
      window.document.dispatchEvent(e);
    });
  };
}
define("VIA.Core.AnimateShorthands", [], function() {
  var slideFadeProp = {
    Up: 'bottom',
    Down: 'top',
    Left: 'right',
    Right: 'left'
  };
  function _slideFade(opacity, element, callback, direction) {
    var prop = direction ? slideFadeProp[direction] : 'bottom';
    var animateProps = {opacity: opacity};
    if (opacity === 'show') {
      element.css(prop, '-=5px');
    }
    animateProps[prop] = '+=5px';
    element.animate(animateProps, {
      duration: 200,
      complete: callback
    });
  }
  return {
    fadeIn: function(element, callback) {
      element.fadeIn(400, callback);
    },
    fadeOut: function(element, callback) {
      element.fadeOut(400, callback);
    },
    fadeInFast: function(element, callback) {
      element.fadeIn(200, callback);
    },
    fadeOutFast: function(element, callback) {
      element.fadeOut(200, callback);
    },
    slideDown: function(element, callback) {
      element.slideDown(400, callback);
    },
    slideUp: function(element, callback) {
      element.slideUp(400, callback);
    },
    slideDownFast: function(element, callback) {
      element.slideDown(200, callback);
    },
    slideUpFast: function(element, callback) {
      element.slideUp(200, callback);
    },
    slideFadeIn: function(element, callback, direction) {
      _slideFade('show', element, callback, direction);
    },
    slideFadeOut: function(element, callback, direction) {
      _slideFade('hide', element, callback, direction);
    }
  };
});
define("VIA.Core.Animation", ["VIA.Core.AnimateShorthands", "VIA.Core.WidgetCommonSettings"], function(AnimateShorthands, WidgetCommonSettings) {
  var followAnimation = {
    absoluteShow: AnimateShorthands.fadeIn,
    absoluteHide: AnimateShorthands.fadeOut,
    absoluteHideDelay: 500,
    inlineShow: AnimateShorthands.slideDown,
    inlineHide: AnimateShorthands.slideUp
  };
  var shareAnimation = {
    flyoutShow: AnimateShorthands.fadeIn,
    flyoutHide: AnimateShorthands.fadeOut,
    flyoutHideDelay: 500
  };
  var DefaultAnimation = {
    follow: followAnimation,
    share: shareAnimation
  };
  var Animation = DefaultAnimation;
  function updateCommonAnimation(mapObj, settingsObj) {
    if (!_.isObject(mapObj.type)) {
      mapObj.type = {};
    }
    _.each(settingsObj, function(settingsValue, settingsKey) {
      if (!_.isObject(mapObj.type[settingsKey])) {
        mapObj.type[settingsKey] = {};
      }
      if (_.isObject(settingsValue) && !_.isFunction(settingsValue)) {
        updateCommonAnimation(mapObj.type[settingsKey], settingsValue);
      } else {
        mapObj.type[settingsKey].defaultValue = settingsValue;
      }
    });
  }
  updateCommonAnimation(WidgetCommonSettings.animation, DefaultAnimation);
  return Animation;
});
define("VIA.Core.Debug", [], function() {
  function addLeadZeroes(n, length) {
    return (n + Math.pow(10, length)).toString().substr(1);
  }
  function getTimeStamp() {
    var date = new Date();
    return '[' + addLeadZeroes(date.getHours(), 2) + ':' + addLeadZeroes(date.getMinutes(), 2) + ':' + addLeadZeroes(date.getSeconds(), 2) + '.' + addLeadZeroes(date.getMilliseconds(), 3) + ']';
  }
  var Debug = function(widgetName) {
    return {
      trace: function(text, isError, isWarning, forcePrint) {
        if (!this.enable && !forcePrint)
          return;
        text = '[VIA.' + widgetName + ']: ' + text;
        if (!window.console || !window.console.log)
          return;
        var message = getTimeStamp() + ' ' + text;
        if ((!console.error || !isError) && (!console.warn || !isWarning)) {
          console.log(message);
        } else if (isWarning) {
          console.warn(message);
        } else {
          console.error(message);
        }
      },
      warn: function(text, forcePrint) {
        this.trace(text, false, true, forcePrint);
      },
      error: function(text, forcePrint) {
        this.trace(text, true, false, forcePrint);
      },
      enabled: false
    };
  };
  return Debug;
});
define("VIA.Core.ExtServiceLoader", ["VIA.Core.StringHelper"], function(StringHelper) {
  var libs = {
    twitter: {
      url: 'http://platform.twitter.com/widgets.js',
      isLoaded: function() {
        return !!window.twttr && !!window.twttr.widgets;
      }
    },
    foursquare: {
      url: 'https://platform.foursquare.com/js/widgets.js',
      isLoaded: function() {
        return !!window.fourSq;
      }
    },
    pinterest: {
      url: 'http://assets.pinterest.com/js/pinit.js',
      isLoaded: function() {
        return window.parsePinBtns;
      }
    },
    google: {
      url: 'https://apis.google.com/js/platform.js',
      isLoaded: function() {
        return !!window.gapi;
      }
    },
    facebook: {
      url: 'http://connect.facebook.net/{LOCALE}/sdk.js#xfbml=1&version=v2.4',
      isLoaded: function() {
        return !!window.FB;
      }
    }
  };
  var ExtServiceLoader = {load: function(service, callback) {
      var libInfo,
          locale;
      libInfo = libs[service.libName || service.id];
      if (libInfo) {
        if (service.id === 'facebook') {
          if ($('#fb-root').length === 0)
            $('body').prepend('<div id="fb-root"></div>');
          locale = service.locale || 'en_US';
          libInfo.url = StringHelper.replace(libInfo.url, {LOCALE: locale});
        }
        if (libInfo.isLoaded()) {
          callback();
        } else {
          if (!libInfo.isLoading) {
            libInfo.isLoading = true;
            if (!libInfo.callbacks) {
              libInfo.callbacks = [];
            }
            if (_.isFunction(callback)) {
              libInfo.callbacks.push(callback);
            }
            $.getScript(libInfo.url, function() {
              delete libInfo.isLoading;
              _.each(libInfo.callbacks, function(c) {
                c();
              });
              delete libInfo.callbacks;
            });
          } else {
            libInfo.callbacks.push(callback);
          }
        }
      }
    }};
  return ExtServiceLoader;
});
define("VIA.Core.GlobalEventBus", [], function() {
  var globalEventBus = _.extend({}, Backbone.Events);
  return globalEventBus;
});
define("VIA.Core.Overlay", ["VIA.Core.Templates"], function(Templates) {
  var FADE_PERIOD = 200;
  var Overlay = Backbone.View.extend({
    initialize: function(options) {
      this.raw = options;
      _.bindAll(this, 'closePopup', 'remove');
      this.render();
    },
    render: function() {
      this.setElement(Templates['_overlay']);
      this.$el.find('.via_popupWindow').append(this.raw.$contentView);
      this.$el.find('.via_popupOverlay, .viaIconCancel').click(this.closePopup);
      this.$el.insertAfter(this.raw.$container).fadeIn(FADE_PERIOD);
      return this;
    },
    closePopup: function() {
      this.$el.fadeOut(FADE_PERIOD, this.remove);
    }
  });
  return Overlay;
});
define("VIA.Core.SettingsValidation", ["VIA.Core.StringHelper", "VIA.Core.WidgetCommonSettings", "VIA.Core.Animation"], function(StringHelper, WidgetCommonSettings, Animation) {
  var Debug;
  function getTypeOf(value) {
    if (_.isArray(value)) {
      return 'array';
    }
    return typeof value;
  }
  function printValues(val) {
    if (_.isArray(val))
      val = val.join('", "');
    return '"' + val + '"';
  }
  function printMessages(messages) {
    _.each(messages, function(message) {
      if (message.type === 'error')
        Debug.error('Settings Validation Error: ' + message.text, true);
      else if (message.type === 'warn')
        Debug.warn('Settings Validation Warning: ' + message.text, true);
    });
  }
  function hasDefaultValue(mapObj) {
    if (!$.isPlainObject(mapObj)) {
      return false;
    }
    for (var key in mapObj) {
      if (key === 'defaultValue') {
        return true;
      }
      if (hasDefaultValue(mapObj[key])) {
        return true;
      }
    }
    return false;
  }
  function _validateSettings(validateObject, settingsObj, baseRoute, silent) {
    var hasError = false,
        messagesList = [],
        widget = this;
    function getParamRoute(key, index, property) {
      var route = key;
      if (baseRoute)
        route = baseRoute + '.' + route;
      if (!_.isUndefined(index))
        route += '[' + index + ']';
      if (property)
        route += '.' + property;
      return route;
    }
    function addMessage(type, text, paramName, list) {
      list = list || messagesList;
      text = text.replace('{0}', 'settings parameter "' + paramName + '"');
      list.push({
        type: type,
        text: StringHelper.capitalize(text)
      });
    }
    baseRoute = baseRoute || '';
    var defaultSettings = {};
    _.each(validateObject, function(validationMap, settingsKey) {
      if (_.isObject(validationMap)) {
        var settingsValue = settingsObj[settingsKey];
        if (validationMap.caseSensitive === false) {
          if (!_.isUndefined(settingsValue) && _.isString(settingsValue)) {
            settingsObj[settingsKey] = settingsValue.toLowerCase();
          }
        }
        if (!_.isUndefined(validationMap.defaultValue)) {
          defaultSettings[settingsKey] = validationMap.defaultValue;
        } else if (validationMap.required) {
          if (_.isUndefined(settingsValue) || _.isNull(settingsValue)) {
            addMessage('error', 'Required {0} is missing', getParamRoute(settingsKey));
            hasError = true;
          }
        }
        if (_.isUndefined(settingsValue) && hasDefaultValue(validationMap.type)) {
          settingsObj[settingsKey] = {};
        }
      }
    }, this);
    var extendedSettings = $.extend({}, defaultSettings, settingsObj);
    _.each(validateObject, function(validationMap, settingsKey) {
      if (_.isObject(validationMap) && _.isFunction(validationMap.defaultValue) && !_.isUndefined(validationMap.type) && validationMap.type !== 'function') {
        defaultSettings[settingsKey] = validationMap.defaultValue.call(extendedSettings);
      }
    });
    _.each(settingsObj, function(settingsValue, settingsKey) {
      if (settingsKey.charAt(0) === '_') {
        return;
      }
      if (_.isNull(settingsValue)) {
        return;
      }
      var validationMap = validateObject[settingsKey];
      if (settingsKey === 'animation' && $.isEmptyObject(settingsValue)) {
        settingsObj[settingsKey] = _.clone(Animation);
        return;
      }
      if (_.isUndefined(validationMap)) {
        if (!validateObject['*']) {
          addMessage('warn', 'Unknown {0}', getParamRoute(settingsKey));
        }
      } else {
        var paramTypes = _.isString(validationMap) || _.isArray(validationMap) ? validationMap : (validationMap.type || getTypeOf(validationMap.defaultValue));
        if (!_.isUndefined(paramTypes)) {
          if (paramTypes === 'number') {
            if (typeof settingsValue === 'number' && isNaN(settingsValue)) {
              settingsValue = '';
            } else if (typeof settingsValue === 'string' && settingsValue && !isNaN(+settingsValue)) {
              settingsValue = +settingsValue;
            }
            settingsObj[settingsKey] = settingsValue;
          }
          paramTypes = _.isArray(paramTypes) ? paramTypes : [paramTypes];
          var messages = [],
              hasValidationError;
          var foundParam = _.find(paramTypes, function(paramType) {
            if ($.isPlainObject(paramType)) {
              if (!$.isPlainObject(settingsValue)) {
                addMessage('error', '{0} is not a ' + printValues('object'), getParamRoute(settingsKey), messages);
                return false;
              }
              var validationResult = widget._validateSettings(paramType, settingsValue, getParamRoute(settingsKey), true);
              if (!validationResult.hasError) {
                settingsObj[settingsKey] = $.extend({}, validationResult.defaultSettings, settingsValue);
                messagesList = messagesList.concat(validationResult.messages);
              } else {
                hasValidationError = true;
                messages.push(validationResult.messages);
              }
              return !validationResult.hasError;
            } else {
              var itemTypesMap = validationMap.itemTypesMap;
              if (paramType === 'array' && _.isArray(settingsValue) && $.isPlainObject(itemTypesMap)) {
                var defaultItemValidationMap = itemTypesMap['*'],
                    noError = true,
                    brokenItems = [];
                _.each(settingsValue, function(arrayItem, index) {
                  var id = arrayItem.id,
                      itemValidationMap;
                  if (!_.isUndefined(id) && !_.isString(id)) {
                    addMessage('error', '{0} is not a string', getParamRoute(settingsKey, index, 'id'));
                  } else if (!_.isUndefined(id)) {
                    itemValidationMap = _.find(itemTypesMap, function(mapItem, index) {
                      if (!_.isUndefined(mapItem.id) && _.isString(index)) {
                        return index.toLowerCase() === id.toLowerCase();
                      }
                    });
                    if (_.isUndefined(itemValidationMap)) {
                      addMessage('error', '{0} has unknown id: ' + printValues(id), getParamRoute(settingsKey, index));
                    }
                  } else {
                    if (!_.isUndefined(defaultItemValidationMap)) {
                      itemValidationMap = defaultItemValidationMap;
                    } else {
                      addMessage('error', 'Id must be set for {0}', getParamRoute(settingsKey, index));
                    }
                  }
                  if (!_.isUndefined(itemValidationMap)) {
                    var validationResult = widget._validateSettings(itemValidationMap, arrayItem, getParamRoute(settingsKey, index + (_.isString(id) ? ':' + id : '')), true);
                    if (validationResult.messages.length) {
                      messagesList = messagesList.concat(validationResult.messages);
                    }
                    if (!validationResult.hasError) {
                      settingsObj[settingsKey][index] = $.extend({}, validationResult.defaultSettings, arrayItem);
                      return true;
                    }
                  }
                  addMessage('error', '{0} is ignored', getParamRoute(settingsKey, index + (_.isString(id) ? ':' + id : '')));
                  brokenItems.push(index);
                });
                _.each(brokenItems, function(brokenItemIndex, shift) {
                  settingsValue.splice(brokenItemIndex - shift, 1);
                });
                if (brokenItems.length && !settingsValue.length) {
                  noError = false;
                  hasValidationError = true;
                  addMessage('error', '{0} array has no valid items', getParamRoute(settingsKey));
                }
                return noError;
              }
              return getTypeOf(settingsValue) === paramType;
            }
          });
          if (!foundParam) {
            hasError = true;
            _.each(messages, function(list) {
              messagesList = messagesList.concat(list);
            });
            var types = _.map(paramTypes, function(paramType) {
              return $.isPlainObject(paramType) ? 'object' : paramType;
            });
            if (hasValidationError) {
              addMessage('error', '{0} has validation error', getParamRoute(settingsKey));
            } else {
              var msg = types.length === 1 ? '{0} is not a ' : '{0} doesn\'t match any of expected types: ';
              addMessage('error', msg + printValues(types), getParamRoute(settingsKey));
            }
            return;
          }
        }
        if (_.isFunction(validationMap)) {
          validationMap = {validate: validationMap};
        }
        if ($.isPlainObject(validationMap)) {
          if (_.isArray(validationMap.enumValues)) {
            var matchesEnum = _.find(validationMap.enumValues, function(enumValue) {
              return enumValue === settingsValue;
            });
            if (!matchesEnum) {
              hasError = true;
              addMessage('error', '{0} has unknown value: ' + printValues(settingsValue) + '. One of the following values is expected: ' + printValues(validationMap.enumValues), getParamRoute(settingsKey));
            }
          }
          if (_.isFunction(validationMap.validate)) {
            var validationResult = validationMap.validate.call(extendedSettings, settingsValue, getParamRoute(settingsKey));
            if (_.isObject(validationResult) && validationResult.error) {
              if (validationResult.error) {
                hasError = true;
                addMessage('error', validationResult.message);
              } else {
                addMessage('warn', validationResult.message);
              }
            }
            if (_.isString(validationResult)) {
              hasError = true;
              addMessage('error', validationResult);
            }
          }
          if (!_.isUndefined(validationMap.min)) {
            if (_.isNumber(validationMap.min)) {
              if (settingsValue < validationMap.min) {
                settingsObj[settingsKey] = validationMap.min;
                addMessage('warn', 'Value of {0} must be not less than ' + validationMap.min + '. The value has been changed to ' + validationMap.min, getParamRoute(settingsKey));
              }
            } else
              hasError = true;
          }
          if (!_.isUndefined(validationMap.max)) {
            if (_.isNumber(validationMap.max)) {
              if (settingsValue > validationMap.max) {
                settingsObj[settingsKey] = validationMap.max;
                addMessage('warn', 'Value of {0} must be not greater than ' + validationMap.max + '. The value has been changed to ' + validationMap.max, getParamRoute(settingsKey));
              }
            } else
              hasError = true;
          }
        }
      }
    }, this);
    if (!silent) {
      printMessages(messagesList);
    }
    return {
      hasError: hasError,
      messages: messagesList,
      defaultSettings: defaultSettings
    };
  }
  return {
    _printValues: printValues,
    _printMessages: printMessages,
    _hasDefaultValue: hasDefaultValue,
    _validateSettings: _validateSettings,
    processSettings: function(settings, validateObject, debug) {
      Debug = debug;
      for (var param in validateObject) {
        if (_.isObject(validateObject[param]) && !_.isUndefined(WidgetCommonSettings[param])) {
          validateObject[param] = _.extend(WidgetCommonSettings[param], validateObject[param]);
        }
      }
      var strippedDefaultSettings = this._validateSettings(validateObject, settings);
      if (strippedDefaultSettings.hasError) {
        Debug.error('Settings Validation Error: Malformed settings', true);
      } else {
        return _.extend({}, strippedDefaultSettings.defaultSettings, settings);
      }
    }
  };
});
define("VIA.Core.StringHelper", [], function() {
  var MORE_POSTFIX = '...';
  return {
    capitalize: function(s) {
      return s.charAt(0).toUpperCase() + s.slice(1);
    },
    compactNumber: function(number) {
      if (number > 999999) {
        return Math.round(number / 1000000) + 'm';
      } else if (number > 999) {
        return Math.round(number / 1000) + 'k';
      }
      return number;
    },
    replace: function(template, data, regExp) {
      if (!_.isString(template))
        return null;
      data = data || {};
      regExp = regExp || /\{(.*?)\}/g;
      return template.replace(regExp, function(match, placeholder) {
        var value = data[placeholder];
        return _.isUndefined(value) || _.isNull(value) ? '' : value;
      });
    },
    truncate: function(value, length) {
      if (_.isUndefined(value) || _.isNull(value))
        return '';
      var result = value.substring(0, length);
      if (length > 0 && value.length > length)
        result += MORE_POSTFIX;
      return result;
    }
  };
});
define("VIA.Core.UrlBuilder", [], function() {
  var UrlBuilder = {addQueryParameter: function(url, name, value, skipEncoding) {
      var urlParts = url.split('#'),
          url = urlParts[0];
      url += (url.indexOf('?') === -1 ? '?' : '&');
      url += name;
      if (value)
        url += '=' + (skipEncoding ? value : encodeURIComponent(value));
      if (typeof urlParts[1] === 'string') {
        url += '#' + urlParts[1];
      }
      return url;
    }};
  return UrlBuilder;
});
define("VIA.Core.UserAgentHelper", [], function() {
  function apply(ua) {
    var browser = ua.match(/(firefox|msie|safari|chrome)[\/\:\s]?(\d+\.\d*)?[\d\.]*/i),
        trident = ua.match(/(trident).*rv\:(\d+\.\d*)/i),
        mobileWebkit = ua.match(/AppleWebKit[\/\:\s]?(\d+\.\d*)?[\d\.]*.*Mobile/i),
        iOsDevice = ua.match(/(iphone|ipad|ipod)/i);
    var agent = {};
    if (browser) {
      agent[browser[1].toLowerCase()] = true;
      agent.version = browser[2] || 0;
      if (agent.safari) {
        var version = ua.match(/(version|phantomjs|crios)\/(\d+\.\d*)?[\d\.]* (mobile\S* )?safari/i);
        agent.version = (version && version[2]) || 0;
      }
    } else if (trident) {
      agent.msie = true;
      agent.version = trident[2];
    }
    if (mobileWebkit) {
      if (!agent.chrome)
        agent.safari = true;
      agent.version = agent.version || mobileWebkit[1] || 0;
    }
    if (agent.version) {
      agent.version = parseFloat(agent.version) || 0;
    }
    if (iOsDevice) {
      if (ua.match(/CriOS/)) {
        agent.chrome = true;
        delete agent.safari;
      }
      agent.ios = true;
      agent[iOsDevice[1].toLowerCase()] = true;
    }
    if (ua.match(/android/i))
      agent.android = true;
    if (ua.match(/iemobile/i))
      agent.winphone = true;
    if (agent.ios || agent.android || agent.winphone)
      agent.mobile = true;
    if (!agent.msie || agent.version > 7)
      agent.supported = true;
    if (agent.android && ua.match(/FBAN\/FB4A/i) || agent.ios && ua.match(/FBAN\/FB(IOS|ForIP)/i))
      agent.fbapp = true;
    if (agent.ios && ua.match(/Twitter for iP/i))
      agent.twapp = true;
    if (agent.fbapp || agent.twapp)
      agent.webview = true;
    return agent;
  }
  var agent = apply(navigator.userAgent);
  agent._apply = apply;
  agent.cookies = false;
  try {
    document.cookie = 'cookietest=1';
    agent.cookies = document.cookie.indexOf('cookietest=') !== -1;
    document.cookie = 'cookietest=1; expires=Thu, 01-Jan-1970 00:00:01 GMT';
  } catch (e) {}
  return agent;
});
window.VIA = window.VIA || {};
if (!VIA.Events) {
  VIA.loadModule('Events', 'on', 'VIA.Core.GlobalEventBus', function(module) {
    VIA.Events = module;
  });
}
define("VIA.Core.WidgetCommonSettings", [], function() {
  return {
    animation: {},
    container: {type: ['string', 'object']}
  };
});
define("VIA.Follow.Templates", [], function() {
  return {
    "_DropdownServiceHolder": "<li> <div class=\"title\"><%= view.model.title %></div><div class=\"followService <%= view.cssClass %>\"></div> </li>",
    "_ExpandableMenu": "<li> <div class=\"expandableMenu\"> <div class=\"followedObject\"> <% if (view.isMobile) {%> <i class=\"sm4IconFacebook\"></i><i class=\"sm4IconTwitter\"></i> <% } %> <h2 class=\"secondaryHeadline\"><%= view.title %></h2> </div> <div class=\"followServices\"> <ul class=\"serviceList clearFloat\"></ul> </div> </div> </li>",
    "_Markup": "<div class=\"elementContent clearFloat <%= view.viewCssClass %>\"> <div class=\"followServices\"> <ul class=\"serviceList floatsWrapper\"></ul> </div> </div>",
    "_ServiceHolder": "<li class=\"followService <%= view.cssClass %>\"></li>",
    "_Facebook": "<div class=\"fb-like\" data-layout=\"<%= view.model.layout %>\" data-action=\"<%= view.model.action %>\" data-height=\"50\" data-show-faces=\"<%= view.model.showFaces %>\" data-href=\"<%= view.model.href %>\" data-share=\"<%= view.model.share %>\" > </div>",
    "_Instagram": "<div class=\"via_instagramFollow viaIconInstagram\"><span class=\"e-via_instagramButtonText\"><%= view.model.buttonTitle %></span></div>",
    "_Pinterest": "<a data-pin-do=\"buttonFollow\" href=\"<%= view.model.href %>\"><%= view.model.buttonTitle %></a>",
    "_Tumblr": "<div class=\"via_tumblrContainer\"> <div class=\"e-via_tumblrOverlay\"></div> <iframe class=\"btn\" frameborder=\"0\" border=\"0\" scrolling=\"no\" allowtransparency=\"true\" height=\"20\" width=\"65\" src=\"<%=view.model.href%>\"></iframe> </div>",
    "_Twitter": "<a class=\"twitter-follow-button\" href=\"<%= view.model.href %>\" data-show-count=\"<%= view.model.showCounter %>\" data-show-screen-name=\"<%= view.model.showScreenName %>\" data-size=\"<%= view.model.size %>\" data-lang=\"<%= view.model.lang %>\"> </a>"
  };
});
define("VIA.Follow.Debug", ["VIA.Core.Debug"], function(Debug) {
  var FollowDebug = Debug('FOLLOW:1.0.0');
  return FollowDebug;
});
define("VIA.Follow.MainView", ["VIA.Follow.LocalConfigCollection", "VIA.Follow.ServiceView", "VIA.Follow.Settings", "VIA.Follow.Templates", "VIA.Core.GlobalEventBus", "VIA.Follow.VerticalViewMenu", "VIA.Follow.HorizontalViewMenu"], function(LocalConfigCollection, ServiceView, Settings, Templates, GlobalEventBus, VerticalViewMenu, HorizontalViewMenu) {
  var MainView = Backbone.View.extend({
    initialize: function(options) {
      this.setElement(options.container);
      this.componentSettings = Settings.apply(options);
      if (options.callbacks)
        _.extend(this, options.callbacks);
      this.topButtonCollection = new LocalConfigCollection(null, {
        parent: this,
        componentSettings: this.componentSettings
      });
      this.menuButtonCollection = new LocalConfigCollection(null, {
        parent: this,
        componentSettings: this.componentSettings
      });
      this.topButtonCollection.add(_.reject(this.componentSettings.elements, function(elem) {
        return elem.id === 'menu';
      }));
      var menuElement = _.find(this.componentSettings.elements, function(elem) {
        return elem.id === 'menu';
      });
      if (menuElement)
        this.menuButtonCollection.add(menuElement.elements);
      this.viewCssClass = this.componentSettings.mode + 'View';
      GlobalEventBus.on('Follow:onFollowed', this.onFollowed);
      this.render();
    },
    render: function() {
      this.$el.addClass('via_follow');
      this.$el.append(_.template(Templates['_Markup'], null, {variable: 'view'})(this));
      this.topButtonCollection.each(function(model) {
        new ServiceView({
          parent: this,
          model: model
        });
      }, this);
      if (this.menuButtonCollection.length) {
        var Menu = this.componentSettings.mode === 'vertical' ? VerticalViewMenu : HorizontalViewMenu;
        this.$el.find('.serviceList').append(new Menu({
          parent: this,
          componentSettings: this.componentSettings
        }).$el);
      }
      return this;
    },
    onFollowed: function(method, profileName) {}
  });
  return MainView;
});
define("VIA.Follow.Settings", ["VIA.Core.SettingsValidation", "VIA.Core.UserAgentHelper", "VIA.Follow.Debug"], function(SettingsValidation, UserAgentHelper, Debug) {
  var Element = {
    id: {
      type: 'string',
      required: true
    },
    profile: {
      type: 'string',
      required: true
    },
    title: {type: 'string'}
  };
  var facebook = {
    locale: {
      type: 'string',
      defaultValue: 'en_US'
    },
    layout: {
      type: 'string',
      defaultValue: 'button_count',
      enumValues: ['standard', 'button_count', 'box_count', 'button']
    },
    showFaces: {
      type: 'boolean',
      defaultValue: false
    },
    share: {
      type: 'boolean',
      defaultValue: false
    }
  };
  facebook = $.extend({}, Element, facebook);
  var twitter = {
    lang: {
      type: 'string',
      defaultValue: 'en'
    },
    showCounter: {
      type: 'boolean',
      defaultValue: true
    },
    showScreenName: {
      type: 'boolean',
      defaultValue: false
    },
    size: {
      type: 'string',
      defaultValue: 'default',
      enumValues: ['large']
    }
  };
  twitter = $.extend({}, Element, twitter);
  var foursquare = {wide: {
      type: 'boolean',
      defaultValue: false
    }};
  foursquare = $.extend({}, Element, foursquare);
  var pinterest = {buttonTitle: {
      type: 'string',
      defaultValue: 'Follow'
    }};
  pinterest = $.extend({}, Element, pinterest);
  var youtube = {
    layout: {
      type: 'string',
      defaultValue: 'default',
      enumValues: ['default', 'full']
    },
    theme: {
      type: 'string',
      defaultValue: 'default',
      enumValues: ['default', 'dark']
    },
    count: {
      type: 'string',
      defaultValue: 'default',
      enumValues: ['default', 'hidden']
    }
  };
  youtube = $.extend({}, Element, youtube);
  var tumblr = {
    color: {
      type: 'string',
      defaultValue: 'blue',
      enumValues: ['blue', 'white', 'black']
    },
    useBlogTitle: {
      type: 'boolean',
      defaultValue: 'false'
    }
  };
  tumblr = $.extend({}, Element, tumblr);
  var instagram = {
    title: 'string',
    buttonTitle: {
      type: 'string',
      defaultValue: 'Follow'
    }
  };
  instagram = $.extend({}, Element, instagram);
  var menu = {
    id: 'string',
    title: 'string',
    profile: 'string',
    elements: {
      type: 'array',
      itemTypesMap: {
        facebook: facebook,
        twitter: twitter,
        pinterest: pinterest,
        foursquare: foursquare,
        youtube: youtube,
        tumblr: tumblr,
        instagram: instagram
      }
    }
  };
  var Settings = {
    animation: {},
    mode: {
      defaultValue: 'horizontal',
      caseSensitive: false,
      enumValues: ['horizontal', 'vertical']
    },
    titleLength: {
      defaultValue: 50,
      min: 0
    },
    elements: {
      type: 'array',
      itemTypesMap: {
        facebook: facebook,
        twitter: twitter,
        pinterest: pinterest,
        foursquare: foursquare,
        menu: menu,
        youtube: youtube,
        tumblr: tumblr,
        instagram: instagram
      },
      defaultValue: function() {
        if (this.mode === 'vertical') {
          return [{
            id: 'menu',
            elements: [{id: 'facebook'}, {id: 'twitter'}]
          }];
        }
        if (this.mode === 'horizontal') {
          return [{
            id: 'menu',
            elements: [{id: 'facebook'}, {id: 'twitter'}]
          }];
        }
        return [{id: 'facebook'}, {id: 'twitter'}];
      }
    },
    responsive: {defaultValue: {breakpoints: [480, 800]}},
    title: {
      type: 'string',
      defaultValue: 'Follow'
    },
    container: {
      type: ['string', 'object'],
      required: true
    },
    callbacks: {type: 'object'},
    debug: {
      type: 'boolean',
      defaultValue: false
    }
  };
  return {apply: function(settings) {
      Debug.trace('Settings: start validation');
      settings = SettingsValidation.processSettings(settings, Settings, Debug);
      if ((UserAgentHelper.mobile || settings.mode === 'vertical') && settings.elements.length > 1) {
        var overrideElements = [];
        $.each(settings.elements, function(topElementIndex, topElement) {
          if (topElement.id === 'menu') {
            $.each(topElement.elements, function(index, element) {
              overrideElements.push(element);
            });
          } else {
            overrideElements.push(topElement);
          }
        });
        settings.elements = [{
          id: 'menu',
          elements: overrideElements
        }];
      }
      return _.extend({}, settings);
    }};
});
window.VIA = window.VIA || {};
if (!VIA.Follow) {
  VIA.loadModule('Follow', 'create', 'VIA.Follow.MainView', function(Module) {
    VIA.Follow.create = function(opt) {
      return new Module(opt);
    };
  });
}
define("VIA.Follow.LocalConfig", ["VIA.Core.ExtServiceLoader", "VIA.Core.GlobalEventBus"], function(ExtServiceLoader, GlobalEventBus) {
  var LocalConfig = Backbone.Model.extend({
    initialize: function(options) {
      this.id = options.id.toLowerCase();
      this.title = options.title || this.id;
      this.profile = options.profile;
    },
    processButton: function(view) {
      ExtServiceLoader.load(this, _.bind(function() {
        this.onLibraryLoad(view);
      }, this));
    },
    onFollow: function() {
      GlobalEventBus.trigger('Follow:onFollowed', this.id, this.profile);
    }
  });
  return LocalConfig;
});
define("VIA.Follow.LocalConfigCollection", ["VIA.Follow.LocalConfig", "VIA.Follow.FacebookConfig", "VIA.Follow.TwitterConfig", "VIA.Follow.FoursquareConfig", "VIA.Follow.PinterestConfig", "VIA.Follow.YouTubeConfig", "VIA.Follow.TumblrConfig", "VIA.Follow.InstagramConfig"], function(LocalConfig, FacebookConfig, TwitterConfig, FoursquareConfig, PinterestConfig, YouTubeConfig, TumblrConfig, InstagramConfig) {
  var LocalConfigCollection = Backbone.Collection.extend({
    model: function(service) {
      var modelMap = {
        facebook: FacebookConfig,
        twitter: TwitterConfig,
        foursquare: FoursquareConfig,
        pinterest: PinterestConfig,
        youtube: YouTubeConfig,
        tumblr: TumblrConfig,
        instagram: InstagramConfig
      };
      return new (modelMap[service.id.toLowerCase()] || LocalConfig)(service);
    },
    initialize: function(data, options) {
      this.parent = options.parent;
      this.componentSettings = options.componentSettings;
    },
    add: function(services) {
      _.each(services, function(service) {
        service.componentSettings = this.componentSettings;
      }, this);
      LocalConfigCollection.__super__.add.call(this, services);
    }
  });
  return LocalConfigCollection;
});
define("VIA.Follow.HorizontalViewMenu", ["VIA.Follow.VerticalViewMenu", "VIA.Core.UserAgentHelper"], function(VerticalViewMenu, UserAgentHelper) {
  var HorizontalViewMenu = VerticalViewMenu.extend({
    initialize: function(options) {
      if (!UserAgentHelper.mobile) {
        this.events = _.extend({}, this.events, {
          'mouseenter .expandableMenu': 'onMouseEnter',
          'mouseleave .expandableMenu': 'onMouseLeave'
        });
      }
      HorizontalViewMenu.__super__.initialize.call(this, options);
      _.bindAll(this, 'onMouseEnter', 'onMouseLeave');
    },
    onMouseEnter: function() {
      if (this.$menu.children('.followServices').css('position') !== 'absolute')
        return;
      clearTimeout(this.hideFlyoutTimeout);
      this.componentSettings.animation.follow.absoluteShow(this.$menu.addClass('expanded').children('.followServices').stop(true, true));
    },
    onMouseLeave: function() {
      clearTimeout(this.hideFlyoutTimeout);
      if (this.$menu.children('.followServices').css('position') !== 'absolute')
        return;
      this.hideFlyoutTimeout = setTimeout(_.bind(function() {
        this.componentSettings.animation.follow.absoluteHide(this.$menu.removeClass('expanded').children('.followServices'));
      }, this), this.componentSettings.animation.follow.absoluteHideDelay);
    },
    onHide: function() {
      this.$menu.removeClass('expanded');
    }
  });
  return HorizontalViewMenu;
});
define("VIA.Follow.MenuServiceView", ["VIA.Follow.ServiceView", "VIA.Follow.Templates"], function(ServiceView, Templates) {
  var MenuServiceView = ServiceView.extend({
    initialize: function(options) {
      this.dropdownHolder = options.isDropdown;
      MenuServiceView.__super__.initialize.call(this, options);
    },
    renderHolder: function() {
      var btnTemplate = Templates[this.dropdownHolder ? '_DropdownServiceHolder' : '_ServiceHolder'];
      var holderMarkup = $(_.template(btnTemplate, null, {variable: 'view'})(this));
      (this.dropdownHolder ? holderMarkup.find('.followService') : holderMarkup).append(this.$el);
      return holderMarkup;
    }
  });
  return MenuServiceView;
});
define("VIA.Follow.ServiceView", ["VIA.Follow.Templates"], function(Templates) {
  var ServiceView = Backbone.View.extend({
    markupMap: {
      facebook: '_Facebook',
      twitter: '_Twitter',
      pinterest: '_Pinterest',
      tumblr: '_Tumblr',
      instagram: '_Instagram'
    },
    initialize: function(options) {
      this.parent = options.parent;
      this.cssClass = this.model.id + 'Service';
      this.render();
    },
    render: function() {
      if (this.markupMap[this.model.id])
        this.setElement(_.template(Templates[this.markupMap[this.model.id]], null, {variable: 'view'})(this));
      this.parent.$el.find('.serviceList').append(this.renderHolder());
      this.model.processButton(this);
      return this;
    },
    renderHolder: function() {
      var holderMarkup = $(_.template(Templates['_ServiceHolder'], null, {variable: 'view'})(this));
      holderMarkup.append(this.$el);
      return holderMarkup;
    }
  });
  return ServiceView;
});
define("VIA.Follow.VerticalViewMenu", ["VIA.Follow.Templates", "VIA.Core.StringHelper", "VIA.Follow.MenuServiceView", "VIA.Core.UserAgentHelper"], function(Templates, StringHelper, MenuServiceView, UserAgentHelper) {
  var VerticalViewMenu = Backbone.View.extend({
    events: {'click .followedObject': 'toggleMenu'},
    initialize: function(options) {
      this.parent = options.parent;
      this.componentSettings = options.componentSettings;
      this.title = this.componentSettings.title;
      this.title = StringHelper.truncate(this.title, this.componentSettings['titleLength']);
      this.isMobile = UserAgentHelper.mobile;
      _.bindAll(this, 'onHide');
      this.render();
    },
    render: function() {
      this.setElement(_.template(Templates['_ExpandableMenu'], null, {variable: 'view'})(this));
      this.$menu = this.$el.find('.expandableMenu');
      this.parent.menuButtonCollection.each(function(model) {
        new MenuServiceView({
          parent: this,
          model: model,
          isDropdown: this.componentSettings.mode === 'horizontal'
        });
      }, this);
      return this;
    },
    toggleMenu: function() {
      if (this.$menu.find('.arrow').css('display') === 'none')
        return;
      if (this.$menu.hasClass('expanded')) {
        this.componentSettings.animation.follow.inlineHide(this.$menu.children('.followServices'), this.onHide);
      } else {
        this.componentSettings.animation.follow.inlineShow(this.$menu.addClass('expanded').children('.followServices'));
      }
    },
    onHide: function() {
      this.$menu.removeClass('expanded');
      this.$menu.children('.followServices').css('display', '');
    }
  });
  return VerticalViewMenu;
});
define("VIA.Follow.FacebookConfig", ["VIA.Follow.LocalConfig"], function(LocalConfig) {
  var FacebookConfig = LocalConfig.extend({
    initialize: function(options) {
      FacebookConfig.__super__.initialize.call(this, options);
      this.locale = options.locale;
      this.layout = options.layout;
      this.showFaces = options.showFaces;
      this.href = this.serviceObjectUrl || 'http://www.facebook.com/' + this.profile;
      this.action = options.action || 'like';
      this.share = options.share;
      _.bindAll(this, 'onLibraryLoad', 'onFollow');
    },
    onLibraryLoad: function(view) {
      window.FB.init({
        status: true,
        oauth: true,
        cookie: false,
        version: 'v2.4'
      });
      window.FB.XFBML.parse(view.$el.parent()[0]);
      window.FB.Event.subscribe('edge.create', this.onFollow);
    }
  });
  return FacebookConfig;
});
define("VIA.Follow.FoursquareConfig", ["VIA.Follow.LocalConfig"], function(LocalConfig) {
  var FoursquareConfig = LocalConfig.extend({
    initialize: function(options) {
      FoursquareConfig.__super__.initialize.call(this, options);
      this.variant = options.wide ? 'wide' : '';
      _.bindAll(this, 'onLibraryLoad', 'onFollow');
    },
    onLibraryLoad: function(view) {
      var widget = new window.fourSq.widget.Follow({
        fuid: this.profile,
        variant: this.variant
      });
      widget.bind('open', this.onFollow);
      widget.replace(view.el);
    }
  });
  return FoursquareConfig;
});
define("VIA.Follow.InstagramConfig", ["VIA.Follow.LocalConfig"], function(LocalConfig) {
  var InstagramConfig = LocalConfig.extend({
    initialize: function(options) {
      InstagramConfig.__super__.initialize.call(this, options);
      this.buttonTitle = options.buttonTitle;
      _.bindAll(this, 'onClick');
    },
    processButton: function(view) {
      view.$el.click(this.onClick);
    },
    onClick: function() {
      window.open('https://instagram.com/' + (this.profile || ''), 'Instagram', 'menubar=1,resizable=1,width=500,height=400');
      this.onFollow();
    }
  });
  return InstagramConfig;
});
define("VIA.Follow.PinterestConfig", ["VIA.Follow.LocalConfig"], function(LocalConfig) {
  var PinterestConfig = LocalConfig.extend({
    initialize: function(options) {
      PinterestConfig.__super__.initialize.call(this, options);
      this.href = 'http://pinterest.com/' + this.profile;
      this.buttonTitle = options.buttonTitle;
      _.bindAll(this, 'onLibraryLoad', 'onFollow');
    },
    onLibraryLoad: function(view) {
      view.$el.parent().click(this.onFollow);
    }
  });
  return PinterestConfig;
});
define("VIA.Follow.TumblrConfig", ["VIA.Follow.LocalConfig"], function(LocalConfig) {
  var TumblrConfig = LocalConfig.extend({
    initialize: function(options) {
      TumblrConfig.__super__.initialize.call(this, options);
      this.href = 'https://platform.tumblr.com/v2/follow_button.html?' + 'tumblelog=' + this.profile + '&color=' + options.color + '&type=' + (options.useBlogTitle ? 'follow-blog' : 'follow');
      _.bindAll(this, 'onClick');
    },
    processButton: function(view) {
      view.$el.click(this.onClick);
    },
    onClick: function() {
      window.open('https://www.tumblr.com/follow/' + this.profile, 'Tumblr', 'menubar=1,resizable=1,width=640,height=480');
      this.onFollow();
    }
  });
  return TumblrConfig;
});
define("VIA.Follow.TwitterConfig", ["VIA.Follow.LocalConfig"], function(LocalConfig) {
  var TwitterConfig = LocalConfig.extend({
    initialize: function(options) {
      TwitterConfig.__super__.initialize.call(this, options);
      this.lang = options.lang;
      this.showScreenName = options.showScreenName;
      this.showCounter = options.showCounter;
      this.href = 'http://twitter.com/' + this.profile;
      this.size = options.size;
      _.bindAll(this, 'onLibraryLoad', 'onFollow');
    },
    onLibraryLoad: function(view) {
      window.twttr.events.bind('follow', this.onFollow);
    }
  });
  return TwitterConfig;
});
define("VIA.Follow.YouTubeConfig", ["VIA.Follow.LocalConfig"], function(LocalConfig) {
  var YouTubeConfig = LocalConfig.extend({
    initialize: function(options) {
      YouTubeConfig.__super__.initialize.call(this, options);
      this.libName = 'google';
      this.layout = options.layout;
      this.count = options.count;
      this.theme = options.theme;
      this.ytSubscribeChangeEvent = _.uniqueId('ytSubscribeEvent_');
      _.bindAll(this, 'onLibraryLoad', 'onFollow');
    },
    onLibraryLoad: function(view) {
      var options = {
        'layout': this.layout,
        'count': this.count,
        'theme': this.theme,
        'channel': this.profile,
        'channelid': this.profile,
        'onytevent': this.ytSubscribeChangeEvent
      };
      window.gapi.ytsubscribe.render(view.$el[0], options);
      window[this.ytSubscribeChangeEvent] = _.bind(function(payload) {
        if (payload.eventType === 'subscribe') {
          this.onFollow();
        }
      }, this);
    }
  });
  return YouTubeConfig;
});
define("VIA.Share.Templates", [], function() {
  return {
    "_embedPopup": "<div class=\"via_share_popup e-via_embedPopup\"> <textarea id=\"embedCode\" class=\"e-via_embedCode\" readonly><%= embedCode %></textarea> <button id=\"copyEmbedButton\" class=\"e-via_copyEmbedButton\"></button> </div> ",
    "_PrimaryButton": "<li> <div class=\"actionItem <%= view.model.id %>\"> <div class=\"actionHover\"></div> <div class=\"actionInner\"> <%= view.renderActionIcon() %> <% if (view.model.isCountVisible) { %> <div class=\"actionCount\"></div> <% } %> </div> <div class=\"actionFlyout\"><%= view.model.title %></div> </div> </li>"
  };
});
define("VIA.Share.Strings", [], function() {
  return {
    "action.PostToFacebook": "Share to Facebook",
    "action.PostToGoogle": "Share to Google",
    "action.PostToTwitter": "Tweet to Twitter",
    "action.PostToWhatsApp": "Share to WhatsApp",
    "action.PostToTumblr": "Share to Tumblr",
    "email": "Email",
    "toggle": "Share this",
    "toggle.close": "Close",
    "embed.copyButtonText": "Copy embed code",
    "embed.selectButtonText": "Select embed code",
    "embed.hintMessage": "Please copy embed code",
    "embed.textAfterCopy": "Copied",
    "embed.textAfterSelect": "Selected"
  };
});
define("VIA.Share.MainView", ["VIA.Share.DefaultButtonView", "VIA.Share.LocalConfigCollection", "VIA.Share.LocalEmailButtonView", "VIA.Share.WhatsAppButtonView", "VIA.Share.ToggleButtonView", "VIA.Share.CustomButtonView", "VIA.Share.EmbedButtonView", "VIA.Core.UserAgentHelper", "VIA.Share.Settings", "VIA.Core.GlobalEventBus", "VIA.Share.Debug"], function(DefaultButtonView, LocalConfigCollection, LocalEmailButtonView, WhatsAppButtonView, ToggleButtonView, CustomButtonView, EmbedButtonView, UserAgentHelper, Settings, GlobalEventBus, Debug) {
  var MainView = Backbone.View.extend({
    viewsMap: {
      'mailto': LocalEmailButtonView,
      'whatsapp': WhatsAppButtonView,
      'toggle': ToggleButtonView,
      'custom': CustomButtonView,
      'embed': EmbedButtonView
    },
    defaultView: DefaultButtonView,
    initialize: function(options) {
      if (options.debug)
        Debug.enable = true;
      Debug.trace('Component initialize...');
      this.setElement(options.container);
      this.componentSettings = Settings.apply(options);
      if (options.callbacks)
        _.extend(this, options.callbacks);
      _.bindAll(this, 'onScroll', 'checkEventOrigin', 'onBeforeShare');
      GlobalEventBus.on('Share:onShared', this.checkEventOrigin);
      GlobalEventBus.on('Share:onBeforeShare', this.onBeforeShare);
      this.render();
    },
    checkEventOrigin: function(service, content) {
      if (this.componentSettings.contentUrl !== content)
        return;
      Debug.trace('Events: "Share:onShared" has been raised');
      this.onShared(service, content);
    },
    createTopLevelElements: function() {
      var topLevelButtons = [];
      this.$el.append('<ul class="shareActions"></ul>');
      this.primaryButtonsCollection = new LocalConfigCollection(null, {
        parent: this,
        componentSettings: this.componentSettings
      });
      this.primaryButtonsCollection.add(this.componentSettings.elements);
      this.primaryButtonsCollection.each(function(model) {
        var view = this.viewsMap[model.buttonViewType || model.id] || this.defaultView;
        Debug.trace('Instance[' + model.id + '].View: Render start');
        var button = new view({
          parent: this,
          model: model,
          componentSettings: this.componentSettings
        }).render();
        topLevelButtons.push(button);
        button.on('showFlyout', function(view) {
          _.each(topLevelButtons, function(button) {
            if (view === button || !button.$flyout)
              return;
            button.hideFlyout(null, true);
          });
        });
        Debug.trace('Instance[' + model.id + '].View: Render finish');
      }, this);
      return topLevelButtons;
    },
    render: function(onComplete) {
      Debug.trace('Component render start');
      if (this.componentSettings.contentData) {
        throw new Error('"contentData" parameter is obsolete. Please remove it.');
      }
      this.createTopLevelElements();
      this.$el.addClass('via_share');
      this.setResponsiveScroll();
      if (_.isFunction(onComplete)) {
        onComplete();
      }
      Debug.trace('Component render finish');
      return this.$el;
    },
    setResponsiveScroll: function() {
      this.$items = this.$el.find('ul.shareActions > li');
      this.pinnedTo = this.componentSettings.views.fixedOrPinned && this.componentSettings.views.fixedOrPinned.pinTo;
      if ((this.pinnedTo === 'left' || this.pinnedTo === 'right') && this.primaryButtonsCollection.at(0).id === 'toggle') {
        this.$items.not(':first').addClass('hidden');
      }
      this.onScroll();
      $(window).bind('resize scroll', _.bind(function() {
        if (this.timerId)
          clearTimeout(this.timerId);
        this.timerId = setTimeout(this.onScroll, 10);
      }, this));
    },
    onScroll: function() {
      var winWidth = $(window).width();
      this.view = _.find(this.componentSettings.views, function(value) {
        return winWidth >= value.screenWidth[0] && winWidth <= value.screenWidth[1];
      }) || {
        behaviour: 'floating',
        offsetTop: 100
      };
      this[this.view.behaviour]();
    },
    floating: function() {
      var $parent = this.$el.parent();
      this.$el.removeClass('fixed left right top bottom');
      this.$items.removeAttr('style');
      if ($(document).scrollTop() > $parent.offset().top - this.view.offsetTop) {
        this.$el.addClass('pinned').css({
          'top': this.view.offsetTop,
          'left': ((UserAgentHelper.mobile && $parent[0].nodeName.toLowerCase() !== 'body') ? $parent.offset().left + 'px' : 'auto')
        });
      } else {
        this.$el.removeClass('pinned').css({
          'top': 'auto',
          'left': 'auto'
        });
      }
    },
    fixed: function() {
      this.$el.removeClass('pinned left right top bottom').addClass('fixed');
      this.$items.removeAttr('style');
    },
    fixedOrPinned: function() {
      this.$el.addClass('fixed');
      this.$el.removeAttr('style');
      switch (this.pinnedTo) {
        case 'left':
        case 'right':
          this.pinLeftRight();
          break;
        case 'top':
        case 'bottom':
          this.pinTopBottom();
          break;
        default:
          this.$el.removeClass('pinned top left bottom right');
      }
    },
    pinLeftRight: function() {
      var cssClass = 'pinned ' + this.pinnedTo,
          topPosition = this.view.offsetTop || 0,
          fakeHeight = topPosition ? 'auto' : '100%';
      if (this.isWidgetOutViewport()) {
        this.$el.addClass(cssClass).css({
          'top': topPosition,
          'height': fakeHeight
        });
      } else {
        this.$el.removeClass(cssClass);
      }
    },
    pinTopBottom: function() {
      var cssClass = 'pinned ' + this.pinnedTo,
          isAbsoluteBottom = $(window).scrollTop() + $(window).height() === $(document).height();
      if (this.isWidgetOutViewport()) {
        this.$el.addClass(cssClass);
        this.$items.width(100 / this.$items.not(':hidden').size() + '%');
        if (this.pinnedTo === 'bottom')
          this.$el.toggleClass('hidden', isAbsoluteBottom);
      } else {
        this.$items.css('width', 'auto');
        this.$el.removeClass(cssClass);
      }
    },
    isWidgetOutViewport: function() {
      var isWidgetAtWindowTop = $(document).scrollTop() > this.$el.parent().offset().top,
          isWidgetAtWindowBottom = $(window).height() + $(window).scrollTop() < this.$el.parent().offset().top;
      return isWidgetAtWindowTop || isWidgetAtWindowBottom;
    },
    onShared: function(service, content) {},
    onBeforeShare: function(service, content, shareInfo) {}
  });
  return MainView;
});
define("VIA.Share.Settings", ["VIA.Core.SettingsValidation", "VIA.Core.UserAgentHelper", "VIA.Share.Strings", "VIA.Share.Debug"], function(SettingsValidation, UserAgentHelper, Strings, Debug) {
  var defaultElements = [{
    id: 'Toggle',
    title: Strings['toggle'],
    close: Strings['toggle.close']
  }, {
    id: 'Facebook',
    title: Strings['action.PostToFacebook'],
    count: true,
    pin: true
  }, {
    id: 'Twitter',
    title: Strings['action.PostToTwitter'],
    count: true,
    pin: true
  }, {
    id: 'MailTo',
    title: Strings['email'],
    pin: false
  }];
  var defaultViews = {
    floating: {
      behaviour: 'floating',
      screenWidth: [768, 99999],
      offsetTop: 100
    },
    fixed: {
      behaviour: 'fixed',
      screenWidth: [0, 768]
    }
  };
  var Element = {
    id: 'string',
    title: 'string',
    pin: {
      type: 'boolean',
      defaultValue: true
    },
    xrs: 'object',
    afterRender: 'function',
    content: {type: {
        url: 'string',
        title: 'string'
      }}
  };
  var Facebook = {
    title: {defaultValue: Strings['action.PostToFacebook']},
    count: {
      type: 'boolean',
      defaultValue: true
    },
    xrs: 'object'
  };
  Facebook = _.extend({}, Element, Facebook);
  var Twitter = {
    title: {defaultValue: Strings['action.PostToTwitter']},
    via: 'string',
    related: 'string',
    count: {
      type: 'boolean',
      defaultValue: true
    },
    xrs: 'object'
  };
  Twitter = _.extend({}, Element, Twitter);
  var Google = {
    title: {defaultValue: Strings['action.PostToGoogle']},
    xrs: 'object'
  };
  Google = _.extend({}, Element, Google);
  var MailTo = {
    title: {defaultValue: Strings['email']},
    subject: 'string',
    body: 'string',
    xrs: 'object'
  };
  MailTo = _.extend({}, Element, MailTo);
  var Toggle = {
    title: {defaultValue: Strings['toggle']},
    close: {defaultValue: Strings['toggle.close']},
    pin: {defaultValue: true},
    xrs: {type: 'object'}
  };
  Toggle = _.extend({}, Element, Toggle);
  var WhatsApp = {
    title: {defaultValue: Strings['action.PostToWhatsApp']},
    xrs: 'object'
  };
  WhatsApp = _.extend({}, Element, WhatsApp);
  var Tumblr = {
    title: {defaultValue: Strings['action.PostToTumblr']},
    xrs: 'object'
  };
  Tumblr = _.extend({}, Element, Tumblr);
  var Custom = {
    title: {defaultValue: Strings['toggle']},
    elementId: {
      type: 'string',
      required: true
    },
    onClick: 'function',
    count: {
      type: 'boolean',
      defaultValue: false
    },
    xrs: 'object'
  };
  Custom = _.extend({}, Element, Custom);
  var Embed = {
    title: {defaultValue: 'Embed'},
    xrs: 'object'
  };
  Embed = _.extend({}, Element, Embed);
  var ContentSettings = {
    title: {
      type: 'string',
      defaultValue: ''
    },
    url: {
      type: 'string',
      required: true
    },
    embed: {type: 'string'}
  };
  var Fixed = {screenWidth: 'array'};
  var Floating = {
    screenWidth: 'array',
    offsetTop: {defaultValue: 100}
  };
  var FixedOrPinned = {
    screenWidth: 'array',
    pinTo: {
      type: 'string',
      enumValues: ['top', 'right', 'bottom', 'left'],
      defaultValue: 'bottom'
    },
    maxNumberOfPinnedElements: {
      defaultValue: 4,
      min: 1
    },
    offsetTop: {defaultValue: 100}
  };
  var Settings = {
    animation: {},
    elements: {
      type: 'array',
      itemTypesMap: {
        Facebook: Facebook,
        Twitter: Twitter,
        Google: Google,
        MailTo: MailTo,
        WhatsApp: WhatsApp,
        Toggle: Toggle,
        Tumblr: Tumblr,
        Custom: Custom,
        Embed: Embed
      },
      defaultValue: defaultElements
    },
    elementIconClass: {defaultValue: {
        toggle: 'viaIconPlus',
        facebook: 'viaIconFacebook',
        twitter: 'viaIconTwitter',
        google: 'viaIconGooglePlus',
        whatsapp: 'viaIconWhatsApp',
        mailto: 'viaIconEnvelope',
        tumblr: 'viaIconTumblr',
        embed: 'viaIconEmbed'
      }},
    views: {
      type: 'object',
      itemTypesMap: {
        'fixed': Fixed,
        'fixed-or-pinned': FixedOrPinned,
        'floating': Floating
      },
      defaultValue: defaultViews
    },
    content: {type: ContentSettings},
    container: {
      type: ['string', 'object'],
      required: true
    },
    callbacks: {type: 'object'},
    debug: {
      type: 'boolean',
      defaultValue: false
    }
  };
  function overrideElementSettings(settings) {
    var overridenElements = [];
    _.each(settings.elements, function(element, index) {
      element = _.clone(element);
      var elementId = element.id.toLowerCase();
      if (elementId === 'toggle') {
        if (index !== 0 || index === 0 && isTopBottomPinned(settings)) {
          return;
        }
      }
      if (elementId === 'whatsapp') {
        if (!UserAgentHelper.mobile || UserAgentHelper.ipad || UserAgentHelper.ipod)
          return;
        element.count = false;
      }
      if ((elementId === 'embed')) {
        if (!settings.embed) {
          return;
        }
      }
      overridenElements.push(_.clone(element));
      if (UserAgentHelper.mobile && isTopBottomPinned(settings)) {
        if (element.pin === false) {
          overridenElements.pop();
        }
        if (overridenElements.length > settings.views.fixedOrPinned.maxNumberOfPinnedElements) {
          overridenElements.length = settings.views.fixedOrPinned.maxNumberOfPinnedElements;
        }
      }
    });
    settings.elements = overridenElements;
  }
  function isTopBottomPinned(settings) {
    if (!settings.views.fixedOrPinned)
      return false;
    return settings.views.fixedOrPinned.pinTo === 'top' || settings.views.fixedOrPinned.pinTo === 'bottom';
  }
  function prepareViewsSettings(settings) {
    var preparedView = {};
    _.each(settings.views, function(value, key) {
      value.screenWidth = key.replace('*', '99999').split('-');
      value.behaviour = value.behaviour.replace(/-\w/g, function(str) {
        return str[1].toUpperCase();
      });
      preparedView[value.behaviour] = value;
    });
    settings.views = preparedView;
  }
  return {
    apply: function(settings) {
      this._tryGetMetaParams(settings);
      if (settings.views)
        prepareViewsSettings(settings);
      Debug.trace('Settings: start validation');
      settings = SettingsValidation.processSettings(settings, Settings, Debug);
      settings.contentUrl = settings.content.url;
      settings.title = settings.content.title;
      settings.embed = settings.content.embed;
      overrideElementSettings(settings);
      return _.extend({}, settings);
    },
    _tryGetMetaParams: function(settings) {
      var metaParams = ['title', 'url', 'embed'];
      settings.content = settings.content || {};
      _.each(metaParams, function(param) {
        if (!_.isString(settings.content[param])) {
          var metaData = this._getMetaData(param);
          if (metaData) {
            settings.content[param] = metaData;
            Debug.trace('Settings: content ' + param + ' is "<content ' + metaData + '>" from og:' + param);
          }
        } else {
          Debug.trace('Settings: content ' + param + ' is "' + settings.content[param] + '" get from widget setting content.' + param);
        }
      }, this);
    },
    _getMetaData: function(param) {
      var meta = $('meta[property="og:' + param + '"]');
      return meta[0] && meta[0].content;
    }
  };
});
define("VIA.Share.Debug", ["VIA.Core.Debug"], function(Debug) {
  var ShareDebug = Debug('SHARE:1.0.0');
  return ShareDebug;
});
window.VIA = window.VIA || {};
if (!VIA.Share) {
  VIA.loadModule('Share', 'create', 'VIA.Share.MainView', function(Module) {
    VIA.Share.create = function(opt) {
      return new Module(opt);
    };
  });
}
define("VIA.Share.LocalConfig", ["VIA.Core.GlobalEventBus", "VIA.Core.UrlBuilder", "VIA.Share.Debug"], function(GlobalEventBus, UrlBuilder, Debug) {
  var LocalConfig = Backbone.Model.extend({
    initialize: function(data) {
      this.id = data.id.toLowerCase();
      Debug.trace('Instance[' + this.id + '].Model: Initialize...');
      this.isCountVisible = data.count;
      this.permalinkExtension = data.permalinkExtension;
      this.title = data.title;
      this.componentSettings = data.componentSettings;
      this.elementIcon = this.componentSettings.elementIconClass[this.id];
      this.userHandlers = {};
      this.userHandlers.afterRender = data.afterRender;
      this.raw = data;
      this.height = data.height || null;
      this.width = data.width || null;
      this.shareUrlTemplate = data.shareUrlTemplate;
      this.xrsCode = data.xrs ? _.extend(data.defaultXrs, data.xrs) : data.defaultXrs;
      this.contentTitle = (data.content && data.content.title) || this.componentSettings.title;
      this.contentUrl = (data.content && data.content.url) || this.componentSettings.contentUrl;
      if (this.xrsCode)
        this.url = UrlBuilder.addQueryParameter(this.contentUrl, this.xrsCode.key, this.xrsCode.value);
      this.counterReqUrl = _.template(data.counterReqUrlTemplate || '')({LINK: encodeURIComponent(this.componentSettings.contentUrl)});
      this.getCounter();
    },
    processUrl: function() {
      var shareInfo = {permalinkExtension: this.permalinkExtension};
      GlobalEventBus.trigger('Share:onBeforeShare', this.xrsCode.value, this.componentSettings.contentUrl, shareInfo);
      this.processedUrl = this.url + (shareInfo.permalinkExtension ? shareInfo.permalinkExtension : '');
      this.urlSettings = {LINK: encodeURIComponent(this.processedUrl)};
      this.finishProcessUrl();
    },
    finishProcessUrl: function() {
      this.processedUrl = _.template(this.shareUrlTemplate)(this.urlSettings);
    },
    getCounter: function() {
      if (!this.counterReqUrl || !this.isCountVisible)
        return;
      Debug.trace('Instance[' + this.id + '].getCounters: GET ' + this.counterReqUrl);
      $.ajax({
        url: this.counterReqUrl,
        dataType: 'jsonp'
      }).done(_.bind(function(data) {
        var message = data.error ? 'seems counter request not working\n' : 'request success\n';
        Debug.trace('Instance[' + this.id + '].getCounters: ' + message + JSON.stringify(data));
        this.processCounter(data);
      }, this));
    },
    onShared: function() {
      this.getCounter();
      GlobalEventBus.trigger('Share:onShared', this.xrsCode.value, this.componentSettings.contentUrl);
    }
  });
  return LocalConfig;
});
define("VIA.Share.LocalConfigCollection", ["VIA.Share.LocalConfig", "VIA.Share.ServiceConfigCollection", "VIA.Share.TwitterConfig", "VIA.Share.FacebookConfig", "VIA.Share.NativeEmailConfig", "VIA.Share.Debug", "VIA.Share.CustomConfig"], function(LocalConfig, ServiceConfigCollection, TwitterConfig, FacebookConfig, NativeEmailConfig, Debug, CustomConfig) {
  var LocalConfigCollection = Backbone.Collection.extend({
    model: function(service) {
      var modelMap = {
        twitter: TwitterConfig,
        facebook: FacebookConfig,
        mailto: NativeEmailConfig,
        custom: CustomConfig
      };
      return new (modelMap[service.id.toLowerCase()] || LocalConfig)(service);
    },
    modelId: function(service) {
      return service.elementId ? service.elementId : service.id;
    },
    initialize: function(data, options) {
      Debug.trace('Collection of buttons initialize...');
      this.parent = options.parent;
      this.componentSettings = options.componentSettings;
    },
    add: function(services) {
      _.each(services, function(service) {
        var serviceConfig = ServiceConfigCollection[service.id.toLowerCase()];
        if (serviceConfig)
          _.extend(service, serviceConfig);
        _.extend(service, {componentSettings: this.componentSettings});
      }, this);
      LocalConfigCollection.__super__.add.call(this, services);
    }
  });
  return LocalConfigCollection;
});
define("VIA.Share.ServiceConfigCollection", [], function() {
  var serviceConfigCollection = {
    twitter: {
      shareUrlTemplate: 'http://twitter.com/intent/tweet?url=<%= LINK %>&text=<%= TITLE %>',
      counterReqUrlTemplate: 'http://urls.api.twitter.com/1/urls/count.json?url=<%= LINK %>',
      height: 450,
      width: 550,
      defaultXrs: {
        key: 'utm',
        value: 'share_twitter'
      }
    },
    facebook: {
      shareUrlTemplate: 'http://www.facebook.com/share.php?u=<%= LINK %>',
      counterReqUrlTemplate: 'http://graph.facebook.com/?id=<%= LINK %>',
      height: 600,
      width: 1005,
      defaultXrs: {
        key: 'fb_ref',
        value: 'share_fb'
      }
    },
    google: {
      shareUrlTemplate: 'https://plus.google.com/share?url=<%= LINK %>',
      height: 600,
      width: 600,
      defaultXrs: {
        key: 'utm_source',
        value: 'share_gplus'
      }
    },
    tumblr: {
      shareUrlTemplate: 'http://www.tumblr.com/share/link?url=<%= LINK %>',
      height: 550,
      width: 650,
      defaultXrs: {
        key: 'xrs',
        value: 'share_tumblr'
      }
    },
    mailto: {defaultXrs: {
        key: 'xrs',
        value: 'share_copy_email'
      }},
    whatsapp: {defaultXrs: {
        key: 'xrs',
        value: 'share_whatsapp'
      }},
    custom: {defaultXrs: {
        key: 'xrs',
        value: 'share_custom'
      }},
    embed: {defaultXrs: {
        key: 'xrs',
        value: 'share_embed'
      }}
  };
  return serviceConfigCollection;
});
define("VIA.Share.ExternalServiceHelper", ["VIA.Core.UserAgentHelper", "VIA.Share.Debug"], function(UserAgentHelper, Debug) {
  function windowSize(dim) {
    return window['outer' + dim] ? window['outer' + dim] : (document.documentElement['client' + dim] ? document.documentElement['client' + dim] : document.body['client' + dim]);
  }
  function openServiceWindow(width, height) {
    if (UserAgentHelper.webview)
      return window;
    var win = window.open('about:blank', '_blank', 'width=' + width + ',height=' + height + ',resizable=yes,scrollbars=yes');
    if (typeof win === 'undefined') {
      UserAgentHelper.webview = true;
      return window;
    } else if (win === window)
      return window;
    win.document.write('<html style="height:100%"><body style="height:100%; padding:0; margin:0;"></body></html>');
    win.document.close();
    return win;
  }
  var ExternalServiceHelper = {shareWithPopup: function(service) {
      var width = service.width ? service.width : windowSize('Width');
      var height = service.height ? service.height : windowSize('Height'),
          serviceWindow;
      serviceWindow = openServiceWindow(width, height);
      var isSameWindow = serviceWindow === window;
      var closeDetectionTimerHandler,
          onWindowClosedHandler = function() {};
      if (serviceWindow) {
        if (isSameWindow && !UserAgentHelper.webview) {
          window.document.write('<html><head><meta http-equiv="refresh" content="0; url=' + service.processedUrl + '"></head></html>');
          window.document.close();
        } else {
          serviceWindow.location.href = service.processedUrl;
          serviceWindow[UserAgentHelper.ios ? 'onpagehide' : 'onunload'] = function() {
            closeDetectionTimerHandler = setInterval(function() {
              var isServiceWindowEmpty = false;
              try {
                isServiceWindowEmpty = serviceWindow.location.href === 'about:blank' || serviceWindow.location.href === location.href;
              } catch (e) {}
              if (!serviceWindow || serviceWindow.closed || isServiceWindowEmpty) {
                clearInterval(closeDetectionTimerHandler);
                serviceWindow.close();
                Debug.trace('Instance[' + service.id + ']: service window closed');
                onWindowClosedHandler();
              }
            }, 500);
          };
        }
      }
    }};
  return ExternalServiceHelper;
});
define("VIA.Share.BaseButtonView", ["VIA.Core.UserAgentHelper", "VIA.Core.StringHelper", "VIA.Share.Templates", "VIA.Share.Debug"], function(UserAgentHelper, StringHelper, Templates, Debug) {
  var BaseButtonView = Backbone.View.extend({
    initialize: function(options) {
      this.parent = options.parent;
      this.componentSettings = options.componentSettings;
      _.bindAll(this, 'showFlyout', 'hideFlyout', 'render', 'onClick');
      if (!UserAgentHelper.mobile) {
        this.events = _.extend({}, this.events, {
          'mouseenter .actionItem': 'showFlyout',
          'mouseleave .actionItem': 'hideFlyout'
        });
      }
      this.listenTo(this.model, 'counterLoaded', this.updateCount);
    },
    renderActionIcon: function() {
      return '<div class="actionIcon ' + this.model.elementIcon + '"></div>';
    },
    render: function() {
      var btnTemplate = Templates['_PrimaryButton'];
      this.setElement(_.template(btnTemplate, null, {variable: 'view'})(this));
      this.$el.click(this.onClick);
      this.$flyout = this.$el.find('.actionFlyout');
      this.parent.$el.find('.shareActions').append(this.$el);
      if (this.model.userHandlers.afterRender)
        this.model.userHandlers.afterRender();
      return this;
    },
    updateCount: function() {
      this.$el.find('.actionCount').html(StringHelper.compactNumber(this.model.counterValue)).addClass('loaded');
    },
    showFlyout: function() {
      clearTimeout(this.hideFlyoutTimeout);
      this.trigger('showFlyout', this);
      this.$el.addClass('hoverItem');
      this.componentSettings.animation.share.flyoutShow(this.$flyout);
    },
    hideFlyout: function(event, immediately) {
      var finishHide = _.bind(function() {
        this.$el.removeClass('hoverItem');
      }, this);
      if (immediately) {
        clearTimeout(this.hideFlyoutTimeout);
        this.$flyout.hide();
        finishHide();
        return;
      }
      this.hideFlyoutTimeout = setTimeout(_.bind(function() {
        this.componentSettings.animation.share.flyoutHide(this.$flyout, finishHide);
      }, this), this.componentSettings.animation.share.flyoutHideDelay);
    },
    onClick: function() {
      Debug.trace('Instance[' + this.model.id + '].Events: "onClick" has been raised');
      this.model.onShared();
    }
  });
  return BaseButtonView;
});
define("VIA.Share.CustomButtonView", ["VIA.Share.BaseButtonView"], function(BaseButtonView) {
  var CustomButtonView = BaseButtonView.extend({onClick: function() {
      CustomButtonView.__super__.onClick.call(this);
      if (this.model.userHandlers.onClick)
        this.model.userHandlers.onClick();
    }});
  return CustomButtonView;
});
define("VIA.Share.DefaultButtonView", ["VIA.Share.BaseButtonView", "VIA.Share.ExternalServiceHelper"], function(BaseButtonView, ExternalServiceHelper) {
  var DefaultButtonView = BaseButtonView.extend({onClick: function() {
      DefaultButtonView.__super__.onClick.call(this);
      this.model.processUrl();
      ExternalServiceHelper.shareWithPopup(this.model);
    }});
  return DefaultButtonView;
});
define("VIA.Share.EmbedPopupView", ["VIA.Core.UserAgentHelper", "VIA.Share.Templates", "VIA.Share.Strings"], function(UserAgentHelper, Templates, Strings) {
  var COPY_TEXT = Strings['embed.copyButtonText'],
      SELECT_TEXT = Strings['embed.selectButtonText'];
  var EmbedPopupView = Backbone.View.extend({
    initialize: function() {
      _.bindAll(this, 'onSelect', 'onCopy');
    },
    render: function(embed, supported) {
      this.setElement(_.template(Templates['_embedPopup'], null, {variable: 'embedCode'})(embed));
      this.$textarea = this.$el.find('#embedCode');
      this.$button = this.$el.find('#copyEmbedButton');
      if (supported) {
        this.$button.html(COPY_TEXT).click(this.onCopy);
      } else {
        this.$button.html(SELECT_TEXT).click(this.onSelect);
      }
      return this;
    },
    returnToInitialState: function(buttonText, hintMessage) {
      window.setTimeout(_.bind(function() {
        this.$button.html(buttonText);
        if (hintMessage) {
          hintMessage.fadeOut(function() {
            this.remove();
          });
        }
      }, this), 3000);
    },
    onCopy: function() {
      this.selectText();
      document.execCommand('copy');
      this.$button.html('&#10004; ' + Strings['embed.textAfterCopy']);
      this.returnToInitialState(COPY_TEXT);
    },
    onSelect: function() {
      var hintMessage;
      this.selectText();
      this.$button.html('&#10004; ' + Strings['embed.textAfterSelect']);
      if (!UserAgentHelper.mobile) {
        hintMessage = $('<span class="e-via_hint">' + Strings['embed.hintMessage'] + '</span>').insertAfter(this.$textarea).fadeIn();
      }
      this.returnToInitialState(SELECT_TEXT, hintMessage);
    },
    selectText: function() {
      if (UserAgentHelper.ios && UserAgentHelper.chrome)
        this.$textarea.removeAttr('readonly');
      this.$textarea.focus();
      this.$textarea[0].setSelectionRange(0, 9999);
    }
  });
  return EmbedPopupView;
});
define("VIA.Share.FacebookConfig", ["VIA.Share.LocalConfig"], function(LocalConfig) {
  var FacebookConfig = LocalConfig.extend({
    initialize: function(options) {
      _.bindAll(this, 'processCounter');
      FacebookConfig.__super__.initialize.call(this, options);
    },
    processCounter: function(data) {
      this.counterValue = data.shares || 0;
      this.trigger('counterLoaded');
    }
  });
  return FacebookConfig;
});
define("VIA.Share.TwitterConfig", ["VIA.Share.LocalConfig", "VIA.Core.UrlBuilder"], function(LocalConfig, UrlBuilder) {
  var TwitterConfig = LocalConfig.extend({
    initialize: function(options) {
      _.bindAll(this, 'processCounter');
      TwitterConfig.__super__.initialize.call(this, options);
      this.extraUrlParams = {
        via: options.via,
        related: options.related
      };
    },
    finishProcessUrl: function() {
      this.urlSettings.TITLE = encodeURIComponent(this.contentTitle);
      TwitterConfig.__super__.finishProcessUrl.call(this);
      _.each(this.extraUrlParams, _.bind(function(value, key) {
        if (value)
          this.processedUrl = UrlBuilder.addQueryParameter(this.processedUrl, key, value);
      }, this));
    },
    processCounter: function(data) {
      this.counterValue = data.count || 0;
      this.trigger('counterLoaded');
    }
  });
  return TwitterConfig;
});
define("VIA.Share.CustomConfig", ["VIA.Share.LocalConfig"], function(LocalConfig) {
  var CustomConfig = LocalConfig.extend({initialize: function(options) {
      this.buttonViewType = options.id.toLowerCase();
      options.id = options.elementId;
      CustomConfig.__super__.initialize.call(this, options);
      this.userHandlers.onClick = options.onClick;
      this.elementIcon = 'viaIcon' + options.id;
    }});
  return CustomConfig;
});
define("VIA.Share.NativeEmailConfig", ["VIA.Share.LocalConfig"], function(LocalConfig) {
  var MAIL_LINK_TEMPALTE = 'mailto:?subject=<%= SUBJECT %>&body=<%= BODY %>';
  var NativeEmailConfig = LocalConfig.extend({initialize: function(options) {
      NativeEmailConfig.__super__.initialize.call(this, options);
      var subject = options.subject || this.componentSettings.title || ' ',
          body = options.body || this.url || ' ';
      this.URLToMail = _.template(MAIL_LINK_TEMPALTE)({
        SUBJECT: encodeURIComponent(subject),
        BODY: encodeURIComponent(body)
      });
    }});
  return NativeEmailConfig;
});
define("VIA.Share.EmbedButtonView", ["VIA.Share.EmbedPopupView", "VIA.Share.BaseButtonView", "VIA.Core.Overlay"], function(EmbedPopupView, BaseButtonView, Overlay) {
  var EmbedButtonView = BaseButtonView.extend({onClick: function() {
      var supported,
          embedPopupView;
      EmbedButtonView.__super__.onClick.call(this);
      try {
        supported = document.execCommand('copy');
      } catch (e) {}
      embedPopupView = new EmbedPopupView().render(this.componentSettings.embed, supported);
      new Overlay({
        $container: this.parent.$el,
        $contentView: embedPopupView.$el
      });
    }});
  return EmbedButtonView;
});
define("VIA.Share.LocalEmailButtonView", ["VIA.Share.BaseButtonView"], function(BaseButtonView) {
  var LocalEmailButtonView = BaseButtonView.extend({
    onClick: function() {
      LocalEmailButtonView.__super__.onClick.call(this);
      this._callMailAgent();
    },
    _callMailAgent: function() {
      window.location.href = this.model.URLToMail;
    }
  });
  return LocalEmailButtonView;
});
define("VIA.Share.ToggleButtonView", ["VIA.Share.BaseButtonView"], function(BaseButtonView) {
  var ToggleButtonView = BaseButtonView.extend({onClick: function() {
      var $shareItems = this.$el.nextAll('li');
      $shareItems.toggleClass('hidden').promise().done(_.bind(function() {
        var isHidden = $shareItems.hasClass('hidden');
        this.$el.find('.actionIcon').toggleClass('viaIconClose', !isHidden).toggleClass('viaIconPlus', isHidden);
      }, this));
    }});
  return ToggleButtonView;
});
define("VIA.Share.WhatsAppButtonView", ["VIA.Core.UserAgentHelper", "VIA.Share.BaseButtonView"], function(UserAgentHelper, BaseButtonView) {
  var WhatsAppButtonView = BaseButtonView.extend({
    onClick: function() {
      WhatsAppButtonView.__super__.onClick.call(this);
      var text = encodeURIComponent(this.componentSettings.contentUrl);
      if (!UserAgentHelper.android) {
        this._redirectToApp('whatsapp://send?text=' + text);
        if (UserAgentHelper.ios) {
          var timer = _.now();
          setTimeout(_.bind(function() {
            if (_.now() - timer > 300)
              return;
            this._redirectToApp('https://itunes.apple.com/us/app/whatsapp-messenger/id310633997');
          }, this), 25);
        }
      } else {
        this._redirectToApp('intent://send?text=' + text + '#Intent;package=com.whatsapp;scheme=whatsapp;launchFlags=268435456;end;');
      }
    },
    _redirectToApp: function(location) {
      window.location = location;
    }
  });
  return WhatsAppButtonView;
});

_removeDefine();
})();