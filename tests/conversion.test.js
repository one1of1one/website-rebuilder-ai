const assert = require("assert");
const {
  convertHtmlToBlade,
  convertHtmlToJsx,
  convertHtmlToVueTemplate,
  convertStyleToJsx,
} = require("../backend/conversion");

function main() {
  const source =
    '<label class="field" for="email" style="color: red; margin-top: 8px"><input id="email" checked><img src="photo.jpg"></label>';

  const jsx = convertHtmlToJsx(source);
  assert(jsx.safe, `expected safe JSX conversion: ${jsx.warnings.join(", ")}`);
  assert(jsx.code.includes('className="field"'));
  assert(jsx.code.includes('htmlFor="email"'));
  assert(jsx.code.includes('style={{ color: "red", marginTop: "8px" }}'));
  assert(jsx.code.includes("checked={true}"));
  assert(jsx.code.includes('<img src="photo.jpg" />'));

  const complexJsx = convertHtmlToJsx(
    '<section onclick="run()"><script>run()</script></section>',
  );
  assert(!complexJsx.safe, "scripts and inline handlers should use fallback");
  assert(complexJsx.fallbackMarkup.includes("<script>"));

  const vue = convertHtmlToVueTemplate(source);
  assert(vue.safe, `expected safe Vue conversion: ${vue.warnings.join(", ")}`);
  assert(vue.code.includes('class="field"'));
  assert(vue.code.includes('for="email"'));
  assert(vue.code.includes('style="color: red; margin-top: 8px"'));
  assert(vue.code.includes('<img src="photo.jpg" />'));

  const complexVue = convertHtmlToVueTemplate("<template><script>run()</script></template>");
  assert(!complexVue.safe, "Vue script/template markup should use fallback");

  const blade = convertHtmlToBlade(source);
  assert(blade.safe, `expected safe Blade conversion: ${blade.warnings.join(", ")}`);
  assert(blade.code.includes('class="field"'));
  assert(blade.code.includes('<input id="email" checked="" />'));

  const complexBlade = convertHtmlToBlade("<p>{{ external_template }}</p>");
  assert(!complexBlade.safe, "existing template syntax should be isolated");
  assert(complexBlade.code.includes("@verbatim"));

  assert.strictEqual(
    convertStyleToJsx("background-image: url('image.png');").safe,
    true,
  );
  assert.strictEqual(
    convertStyleToJsx("width: expression(alert(1));").safe,
    false,
  );

  console.log(
    JSON.stringify(
      {
        ok: true,
        jsxLength: jsx.code.length,
        vueLength: vue.code.length,
        bladeLength: blade.code.length,
        fallbackWarnings: complexJsx.warnings.length,
      },
      null,
      2,
    ),
  );
}

main();
