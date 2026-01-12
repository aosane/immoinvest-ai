import Chat from './pages/Chat';
import Settings from './pages/Settings';
import __Layout from './Layout.jsx';


export const PAGES = {
    "Chat": Chat,
    "Settings": Settings,
}

export const pagesConfig = {
    mainPage: "Chat",
    Pages: PAGES,
    Layout: __Layout,
};