import React, { useEffect, useRef } from "react";
import PropTypes from "prop-types";

const SmartIframe = ({
  attributes,
  handleReady,
  handleReceiveMessage,
  postMessageData = "",
  serializeMessage = true,
  targetOrigin = "*",
  title
}) => {
  const iframeEl = useRef(null);
  const defaults = {
    allowFullScreen: false,
    frameBorder: 0
  };

  useEffect(() => {
    const onLoad = () => {
      if (handleReady) {
        handleReady();
      }
      // TODO: Look into doing a syn-ack TCP-like handshake
      // to make sure iFrame is ready to REALLY accept messages, not just loaded.
      // send intial props when iframe loads
      sendMessage(postMessageData);
    };

    const onReceiveMessage = event => {
      if (handleReceiveMessage) {
        handleReceiveMessage(event);
      }
    };

    const serializePostMessageData = data => {
      // Rely on the browser's built-in structured clone algorithm for serialization of the
      // message as described in
      // https://developer.mozilla.org/en-US/docs/Web/API/Window/postMessage
      if (!serializeMessage) {
        return data;
      }

      // To be on the safe side we can also ignore the browser's built-in serialization feature
      // and serialize the data manually.
      if (typeof data === "object") {
        return JSON.stringify(data);
      } else if (typeof data === "string") {
        return data;
      } else {
        return `${data}`;
      }
    };

    const sendMessage = postMessageData => {
      // Using postMessage data from props will result in a subtle but deadly bug,
      // where old data from props is being sent instead of new postMessageData.
      // This is because data sent from componentWillReceiveProps is not yet in props but only in nextProps.
      const serializedData = serializePostMessageData(postMessageData);
      iframeEl.contentWindow.postMessage(serializedData, targetOrigin);
    };

    window.addEventListener("message", onReceiveMessage);
    if (iframeEl.current) iframeEl.current.addEventListener("load", onLoad);
    return () => window.removeEventListener("message", onReceiveMessage, false);
  }, [
    iframeEl,
    handleReady,
    handleReceiveMessage,
    postMessageData,
    serializeMessage,
    targetOrigin
  ]);

  return <iframe ref={iframeEl} title={title} {...defaults} {...attributes} />;
};

SmartIframe.propTypes = {
  /*
        Iframe Attributes
        https://developer.mozilla.org/en-US/docs/Web/HTML/Element/iframe#Attributes
        React Supported Attributes
        https://facebook.github.io/react/docs/dom-elements.html#all-supported-html-attributes
        Note: attributes are camelCase, not all lowercase as usually defined.
    */
  attributes: PropTypes.shape({
    allowFullScreen: PropTypes.oneOfType([PropTypes.string, PropTypes.bool]),
    frameBorder: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    height: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    name: PropTypes.string,
    scrolling: PropTypes.string,
    // https://www.html5rocks.com/en/tutorials/security/sandboxed-iframes/
    sandbox: PropTypes.string,
    srcDoc: PropTypes.string,
    src: PropTypes.string.isRequired,
    // <iframe> elements must have a unique title property  jsx-a11y/iframe-has-title
    title: PropTypes.string.isRequired,
    width: PropTypes.oneOfType([PropTypes.string, PropTypes.number])
  }),

  // Callback function called when iFrame sends the parent window a message.
  handleReceiveMessage: PropTypes.func,

  /*    
        Callback function called when iframe loads. 
        We're simply listening to the iframe's `window.onload`.
        To ensure communication code in your iframe is totally loaded,
        you can implement a syn-ack TCP-like handshake using `postMessageData` and `handleReceiveMessage`.
    */
  handleReady: PropTypes.func,

  /*
        You can pass it anything you want, we'll serialize to a string
        preferablly use a simple string message or an object.
        If you use an object, you need to follow the same naming convention
        in the iframe so you can parse it accordingly.
     */
  postMessageData: PropTypes.any,

  /*
        Enable use of the browser's built-in structured clone algorithm for serialization
        by settings this to `false`. 
        Default is `true`, using our built in logic for serializing everything to a string.
    */
  serializeMessage: PropTypes.bool,

  /*
        Always provide a specific targetOrigin, not *, if you know where the other window's document should be located. Failing to provide a specific target discloses the data you send to any interested malicious site.
     */
  targetOrigin: PropTypes.string
};

export default SmartIframe;
