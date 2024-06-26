const App = () => {
  return (
    <>
      <div className="max-w-sm mx-auto mt-32 mb-10 h-auto py-5 px-4 shadow-2xl text-center rounded-lg">
        <div className="bg-orange-300 rounded-lg">
          <p className=" text-3xl text-gray-900  dark:text-white">React</p>
        </div>

        <div className="grid grid-cols-3 py-5">
          <button className="px-5 py-9 rounded-tl-lg border-t-2 border-l-2 border-blue-400 hover:bg-blue-400">
            1
          </button>
          <button className="px-5 py-9 border-t-2 border-r-2 border-l-2 border-blue-400 hover:bg-blue-400">
            2
          </button>
          <button className="px-5 py-9 rounded-tr-lg border-t-2 border-r-2 border-blue-400 hover:bg-blue-400">
            3
          </button>
          <button className="px-5 py-9 border-t-2 border-b-2 border-l-2 border-blue-400 hover:bg-blue-400">
            4
          </button>
          <button className="px-5 py-9 border-2 border-blue-400 hover:bg-blue-400">
            5
          </button>
          <button className="px-5 py-9 border-t-2 border-b-2 border-r-2 border-blue-400 hover:bg-blue-400">
            6
          </button>
          <button className="px-5 py-9 rounded-bl-lg border-b-2 border-l-2 border-blue-400 hover:bg-blue-400">
            7
          </button>
          <button className="px-5 py-9 border-b-2 border-r-2 border-l-2 border-blue-400 hover:bg-blue-400">
            8
          </button>
          <button className="px-5 py-9 rounded-br-lg border-b-2 border-r-2 border-blue-400 hover:bg-blue-400">
            9
          </button>
        </div>

        <div
          className="inline-flex items-centers rounded-md shadow-sm text-center bg-slate-600"
          role="group">
          <button
            type="button"
            className="px-4 py-2 text-sm font-medium rounded-s-lg text-white hover:bg-slate-700">
            Reset Game
          </button>
          <button
            type="button"
            className="px-4 py-2 text-sm font-medium rounded-e-lg text-white hover:bg-slate-700">
            Taunt
          </button>
        </div>
      </div>
      <div className="bg-gray-300 max-w-xs mx-auto p-4 rounded-lg">
        <p>
          Playing in:{" "}
          <span className="bg-slate-700 text-white rounded-md text-xs px-2 py-1">
            Room 2
          </span>
        </p>
        <p>
          You are:{" "}
          <span className="bg-slate-700 text-white rounded-md text-xs px-2 py-1">
            X
          </span>
        </p>
        <p>
          Opponent:{" "}
          <span className="bg-slate-700 text-white rounded-md text-xs px-2 py-1">
            Nyan Lin Htoo
          </span>
        </p>
      </div>
    </>
  );
};

export default App;
