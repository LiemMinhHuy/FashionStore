// ~/utils/utils.js
export const isCloseToBottom = (windowObj) => {
    const paddingToBottom = 100; // Tăng từ 20px lên 100px
    return windowObj.innerHeight + windowObj.scrollY >= document.documentElement.offsetHeight - paddingToBottom;
};
