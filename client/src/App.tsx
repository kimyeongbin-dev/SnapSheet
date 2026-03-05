import ImageUpload from './components/ImageUpload';

function App() {
  return (
    // min-h-screen: 최소 높이를 화면 전체로 설정
    // flex, items-center, justify-center: 자식 컴포넌트(ImageUpload)를 정중앙 배치
    // bg-zinc-950: 세련된 다크 모드 배경색
    <div className="min-h-screen flex flex-col items-center justify-center bg-zinc-950 p-6">
      <h1 className="text-4xl font-extrabold text-white tracking-tighter mb-10">
        SnapSheet MVP
      </h1>
      <ImageUpload />
    </div>
  );
}

export default App;