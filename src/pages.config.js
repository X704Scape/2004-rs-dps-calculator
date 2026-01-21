import Calculator from './pages/Calculator';
import IconDiagnostics from './pages/IconDiagnostics';
import MissingIcons from './pages/MissingIcons';
import __Layout from './Layout.jsx';


export const PAGES = {
    "Calculator": Calculator,
    "IconDiagnostics": IconDiagnostics,
    "MissingIcons": MissingIcons,
}

export const pagesConfig = {
    mainPage: "Calculator",
    Pages: PAGES,
    Layout: __Layout,
};