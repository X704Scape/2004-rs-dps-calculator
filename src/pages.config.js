import Calculator from './pages/Calculator';
import __Layout from './Layout.jsx';


export const PAGES = {
    "Calculator": Calculator,
}

export const pagesConfig = {
    mainPage: "Calculator",
    Pages: PAGES,
    Layout: __Layout,
};