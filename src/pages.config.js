import Chat from './pages/Chat';
import Settings from './pages/Settings';
import Setup from './pages/Setup';
import __Layout from './Layout.jsx';


export const PAGES = {
    "Chat": Chat,
    "Settings": Settings,
    "Setup": Setup,
}

export const pagesConfig = {
    mainPage: "Chat",
    Pages: PAGES,
    Layout: __Layout,
};