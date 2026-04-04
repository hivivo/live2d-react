import './App.css';

function App() {
  return (
    <main className="demo-shell">
      <section className="copy">
        <p className="eyebrow">live2d-react</p>
        <h1>Bring your own Cubism Core, model assets, and host app.</h1>
        <p className="lede">
          This package intentionally does not bundle Live2D Core or third-party
          model assets. It provides a React wrapper around the Cubism Web
          Framework and ships only the shader files required by the renderer.
        </p>
        <pre>{`import { Live2D } from 'live2d-react';

<Live2D
  modelJsonPath="/models/Hiyori/Hiyori.model3.json"
  coreScriptSrc="/cubism/core/live2dcubismcore.min.js"
  style={{ width: 420, height: 420 }}
/>;
`}</pre>
        <p className="note">
          Add your own local Cubism Core file and model assets if you want to
          turn this dev app into a live preview while working on the library.
        </p>
      </section>
    </main>
  );
}

export default App;
