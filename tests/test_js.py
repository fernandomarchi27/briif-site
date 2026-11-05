"""Syntax and real KaTeX rendering in QuickJS (not a browser/DOM test)."""
import unittest
from pathlib import Path
try:
    import quickjs
except ImportError:
    quickjs=None
ROOT=Path(__file__).resolve().parent.parent
@unittest.skipIf(quickjs is None,'Install quickjs from requirements-dev.txt')
class JavascriptTests(unittest.TestCase):
    def test_changed_scripts_syntax(self):
        ctx=quickjs.Context()
        for name in ['app','login','menu','ai','verificar-email','ai-launcher','ai-config','tema']:
            source=(ROOT/f'assets/js/{name}.js').read_text()
            import json
            ctx.eval('new Function('+json.dumps(source)+')')
    def test_math_and_untrusted_html(self):
        ctx=quickjs.Context()
        ctx.eval((ROOT/'assets/vendor/katex/katex.min.js').read_text())
        markup=ctx.eval(r'''katex.renderToString('x = \\frac{-b \\pm \\sqrt{b^2-4ac}}{2a}',{throwOnError:false,trust:false})''')
        self.assertIn('<math',markup);self.assertIn('mfrac',markup)
        untrusted=ctx.eval(r'''katex.renderToString('\\href{javascript:alert(1)}{x}',{throwOnError:false,trust:false})''')
        self.assertNotIn('href="javascript:',untrusted)
