export const neutralizeProductionLogs = () => {
  if (!__DEV__) {
    // PRODUCTION MODE DETECTED: Override all console output channels to empty no-ops.
    // This prevents malicious actors from attaching USB debugging tools (Logcat/Safari Inspector) 
    // to sniff out decrypted financial payloads passing through memory.
    const noOp = () => {};
    
    console.log = noOp;
    console.info = noOp;
    console.warn = noOp;
    console.error = noOp;
    console.debug = noOp;
  }
};
