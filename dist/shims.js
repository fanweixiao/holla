// Generated by CoffeeScript 1.6.3
(function() {
  var IceCandidate, MediaStream, PeerConnection, SessionDescription, URL, attachStream, browser, extract, getUserMedia, processSDPIn, processSDPOut, removeCN, replaceCodec, shim, supported, useOPUS;

  PeerConnection = window.mozRTCPeerConnection || window.PeerConnection || window.webkitPeerConnection00 || window.webkitRTCPeerConnection;

  IceCandidate = window.mozRTCIceCandidate || window.RTCIceCandidate;

  SessionDescription = window.mozRTCSessionDescription || window.RTCSessionDescription;

  MediaStream = window.MediaStream || window.webkitMediaStream;

  getUserMedia = navigator.mozGetUserMedia || navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.msGetUserMedia;

  URL = window.URL || window.webkitURL || window.msURL || window.oURL;

  if (getUserMedia != null) {
    getUserMedia = getUserMedia.bind(navigator);
  }

  browser = (navigator.mozGetUserMedia ? 'firefox' : 'chrome');

  supported = (PeerConnection != null) && (getUserMedia != null);

  extract = function(str, reg) {
    var match;
    match = str.match(reg);
    return (match != null ? match[1] : null);
  };

  replaceCodec = function(line, codec) {
    var el, els, idx, out, _i, _len;
    els = line.split(' ');
    out = [];
    for (idx = _i = 0, _len = els.length; _i < _len; idx = ++_i) {
      el = els[idx];
      if (idx === 3) {
        out[idx++] = codec;
      }
      if (el !== codec) {
        out[idx++] = el;
      }
    }
    return out.join(' ');
  };

  removeCN = function(lines, mLineIdx) {
    var cnPos, idx, line, mLineEls, payload, _i, _len;
    mLineEls = lines[mLineIdx].split(' ');
    for (idx = _i = 0, _len = lines.length; _i < _len; idx = ++_i) {
      line = lines[idx];
      if (!(line != null)) {
        continue;
      }
      payload = extract(line, /a=rtpmap:(\d+) CN\/\d+/i);
      if (payload != null) {
        cnPos = mLineEls.indexOf(payload);
        if (cnPos !== -1) {
          mLineEls.splice(cnPos, 1);
        }
        lines.splice(idx, 1);
      }
    }
    lines[mLineIdx] = mLineEls.join(' ');
    return lines;
  };

  useOPUS = function(sdp) {
    var idx, line, lines, mLineIdx, payload, _i, _len;
    lines = sdp.split('\r\n');
    mLineIdx = ((function() {
      var _i, _len, _results;
      _results = [];
      for (idx = _i = 0, _len = lines.length; _i < _len; idx = ++_i) {
        line = lines[idx];
        if (line.indexOf('m=audio') !== -1) {
          _results.push(idx);
        }
      }
      return _results;
    })())[0];
    if (mLineIdx == null) {
      return sdp;
    }
    for (idx = _i = 0, _len = lines.length; _i < _len; idx = ++_i) {
      line = lines[idx];
      if (!(line.indexOf('opus/48000') !== -1)) {
        continue;
      }
      payload = extract(line, /:(\d+) opus\/48000/i);
      if (payload != null) {
        lines[mLineIdx] = replaceCodec(lines[mLineIdx], payload);
      }
      break;
    }
    lines = removeCN(lines, mLineIdx);
    return lines.join('\r\n');
  };

  processSDPOut = function(sdp) {
    var addCrypto, line, out, _i, _j, _len, _len1, _ref, _ref1;
    out = [];
    if (browser === 'firefox') {
      addCrypto = "a=crypto:1 AES_CM_128_HMAC_SHA1_80 inline:BAADBAADBAADBAADBAADBAADBAADBAADBAADBAAD";
      _ref = sdp.split('\r\n');
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        line = _ref[_i];
        out.push(line);
        if (line.indexOf('m=') === 0) {
          out.push(addCrypto);
        }
      }
    } else {
      _ref1 = sdp.split('\r\n');
      for (_j = 0, _len1 = _ref1.length; _j < _len1; _j++) {
        line = _ref1[_j];
        if (line.indexOf("a=ice-options:google-ice") === -1) {
          out.push(line);
        }
      }
    }
    return useOPUS(out.join('\r\n'));
  };

  processSDPIn = function(sdp) {
    return sdp;
  };

  attachStream = function(uri, el) {
    var e, _i, _len;
    if (typeof el === "string") {
      return attachStream(uri, document.getElementById(el));
    } else if (el.jquery) {
      el.attr('src', uri);
      for (_i = 0, _len = el.length; _i < _len; _i++) {
        e = el[_i];
        e.play();
      }
    } else {
      el.src = uri;
      el.play();
    }
    return el;
  };

  shim = function() {
    var PeerConnConfig, mediaConstraints, out;
    if (!supported) {
      return;
    }
    if (browser === 'firefox') {
      PeerConnConfig = {
        iceServers: [
          {
            url: "stun:23.21.150.121"
          }
        ]
      };
      mediaConstraints = {
        mandatory: {
          OfferToReceiveAudio: true,
          OfferToReceiveVideo: true,
          MozDontOfferDataChannel: true
        }
      };
      MediaStream.prototype.getVideoTracks = function() {
        return [];
      };
      MediaStream.prototype.getAudioTracks = function() {
        return [];
      };
    } else {
      PeerConnConfig = {
        iceServers: [
          {
            url: "stun:stun.l.google.com:19302"
          }, {
            url: "stun:stun1.l.google.com:19302"
          }, {
            url: "stun:stun2.l.google.com:19302"
          }, {
            url: "stun:stun3.l.google.com:19302"
          }, {
            url: "stun:stun4.l.google.com:19302"
          }
        ]
      };
      mediaConstraints = {
        mandatory: {
          OfferToReceiveAudio: true,
          OfferToReceiveVideo: true
        },
        optional: [
          {
            DtlsSrtpKeyAgreement: true
          }
        ]
      };
      if (!MediaStream.prototype.getVideoTracks) {
        MediaStream.prototype.getVideoTracks = function() {
          return this.videoTracks;
        };
        MediaStream.prototype.getAudioTracks = function() {
          return this.audioTracks;
        };
      }
      if (!PeerConnection.prototype.getLocalStreams) {
        PeerConnection.prototype.getLocalStreams = function() {
          return this.localStreams;
        };
        PeerConnection.prototype.getRemoteStreams = function() {
          return this.remoteStreams;
        };
      }
    }
    MediaStream.prototype.pipe = function(el) {
      var uri;
      uri = URL.createObjectURL(this);
      attachStream(uri, el);
      return this;
    };
    out = {
      PeerConnection: PeerConnection,
      IceCandidate: IceCandidate,
      SessionDescription: SessionDescription,
      MediaStream: MediaStream,
      getUserMedia: getUserMedia,
      URL: URL,
      attachStream: attachStream,
      processSDPIn: processSDPIn,
      processSDPOut: processSDPOut,
      PeerConnConfig: PeerConnConfig,
      browser: browser,
      supported: supported,
      constraints: mediaConstraints
    };
    return out;
  };

  module.exports = shim();

}).call(this);
