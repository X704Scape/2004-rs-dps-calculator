import IconDiagnostics from './pages/IconDiagnostics';
import MissingIcons from './pages/MissingIcons';
import Calculator from './pages/Calculator';
import __Layout from './Layout.jsx';


export const PAGES = {
    "IconDiagnostics": IconDiagnostics,
    "MissingIcons": MissingIcons,
    "Calculator": Calculator,
}

export const pagesConfig = {
    mainPage: "Calculator",
    Pages: PAGES,
    Layout: __Layout,
};