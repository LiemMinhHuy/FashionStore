export const isCloseToBottom = (windowObj) => {
    const paddingToBottom = 20;
    return windowObj.innerHeight + windowObj.scrollY >= document.documentElement.offsetHeight - paddingToBottom;
};
