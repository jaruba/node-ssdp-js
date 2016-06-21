"use strict";

var _prototypeProperties = function (child, staticProps, instanceProps) { if (staticProps) Object.defineProperties(child, staticProps); if (instanceProps) Object.defineProperties(child.prototype, instanceProps); };

var _inherits = function (subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) subClass.__proto__ = superClass; };

var _classCallCheck = function (instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } };

var SSDP = require("./ssdp");
var EventEmitter = require("events").EventEmitter;
var http = require("http");
var getPort = require("get-port");

function getXML(address, cb) {
    http.get(address, function (res) {
        var body = "";
        res.on("data", function (chunk) {
            return body += chunk;
        });
        res.on("end", function () {
            return cb(body.toString());
        });
    });
}

function search(ssdp, cb) {
    ssdp.onResponse(function (headers, rinfo) {
        if (!headers.LOCATION || headers.LOCATION.indexOf("https://") !== -1) return;
        getXML(headers.LOCATION, function (xml) {
            cb(headers, rinfo, xml);
        });
    });
}

function getXmlArg(name, xml) {
    return xml.match(new RegExp('<'+name+'>(.+?)<\/'+name+'>', ''))[1]
}

var Browser = (function (EventEmitter) {
    function Browser(cb) {
        var that = this;

        getPort().then(function(port) {

            that._upnpSSDP = new SSDP(port);
            that._devices = [];

            _classCallCheck(that, Browser);
            cb();

        });
    }

    _inherits(Browser, EventEmitter);

    _prototypeProperties(Browser, null, {
        searchUPnP: {
            value: function searchUPnP() {
                var _this = this;

                search(this._upnpSSDP, function (headers, rinfo, xml) {

                    var name = getXmlArg('friendlyName', xml);
                    if (!name) return;

                    var device = new EventEmitter();
                    device.name = name;
                    device.modelName = getXmlArg('modelName', xml);
                    device.modelDescription = getXmlArg('modelDescription', xml);
                    device.modelNumber = getXmlArg('modelNumber', xml);
                    device.serialNumber = getXmlArg('serialNumber', xml);
                    device.address = rinfo.address;
                    device.xml = headers.LOCATION;
                    device.headers = headers;
                    device.type = "upnp";

                    _this._devices.push(device);

                    _this.emit("deviceOn", device);
                });
                this._upnpSSDP.search("urn:schemas-upnp-org:device:MediaRenderer:1");
            },
            writable: true,
            configurable: true
        },
        start: {
            value: function start() {
                this.searchUPnP();
            },
            writable: true,
            configurable: true
        },
        destroy: {
            value: function destroy() {
                this._upnpSSDP.destroy();
            },
            writable: true,
            configurable: true
        },
        onDevice: {
            value: function onDevice(cb) {
                this.on("deviceOn", cb);
            },
            writable: true,
            configurable: true
        },
        getList: {
            value: function getList() {
                return this._devices;
            },
            writable: true,
            configurable: true
        }
    });

    return Browser;
})(EventEmitter);

module.exports = Browser;
