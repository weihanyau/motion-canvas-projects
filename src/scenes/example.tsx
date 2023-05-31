import { Rect, Txt } from "@motion-canvas/2d/lib/components";
import {
  CodeBlock,
  lines,
  range as rangeCodeBlock,
} from "@motion-canvas/2d/lib/components/CodeBlock";
import { PossibleCanvasStyle } from "@motion-canvas/2d/lib/partials";
import { makeScene2D } from "@motion-canvas/2d/lib/scenes";
import {
  all,
  chain,
  loop,
  sequence,
  waitFor,
} from "@motion-canvas/core/lib/flow";
import { SignalValue } from "@motion-canvas/core/lib/signals";
import { ThreadGenerator } from "@motion-canvas/core/lib/threading";
import { easeOutCubic } from "@motion-canvas/core/lib/tweening";
import {
  beginSlide,
  createRef,
  makeRef,
  range,
} from "@motion-canvas/core/lib/utils";

// color scheme
const RED = "#ff6470";
const GREEN = "#99C47A";
const BLUE = "#88C0D0";

// input data
const pages: number[][] = [
  [7, 0, 1, 2, 0],
  [3, 0, 4, 2, 3],
  [0, 3, 2, 1, 2],
  [0, 1, 7, 0, 1],
];

// code
const code = `
int pageFaults(int pages[], int n, int frames) {
  unordered_set<int> s;
  queue<int> index;
  int page_faults = 0;

  for (int i = 0; i < n; i++) {
      // check for free spaces in the frame
      if (s.size() < frames) {
          // check for page not present in the frame
          if (s.find(pages[i]) == s.end()) {
              s.insert(pages[i]);
              index.push(pages[i]);
              page_faults++;
          }
      } else {
          if (s.find(pages[i]) == s.end()) {
              int val = index.front();
              index.pop();
              s.erase(val);
              s.insert(pages[i]);
              index.push(pages[i]);
              page_faults++;
          }
      }
  }

  return page_faults;
}`;

export default makeScene2D(function* (view) {
  const inputs: Rect[][] = [[], [], [], []];
  const setRefs: Rect[] = [];
  const queueRefs: Rect[] = [];
  const inputTextRef = createRef<Txt>();
  const pagesMatrixRef = createRef<Rect>();
  const inputLabelRef = createRef<Txt>();
  const codeRef = createRef<CodeBlock>();
  const variableVisualRef = createRef<Rect>();
  const pageFaultRef = createRef<Txt>();

  // generator function to draw attention to text
  function* highlightText(txt: Txt) {
    yield* loop(2, () => chain(txt.fill(RED, 0.2), txt.fill("white", 0.2)));
  }

  // generator function that add one child to a node
  function* addChild(node: Node, child: Node) {
    yield* waitFor(1);
  }

  // function to create page UI component
  const createPageComponent = (
    text: string,
    fill: SignalValue<PossibleCanvasStyle>,
    opacity: SignalValue<number> = 1
  ) => {
    return (
      <Rect opacity={opacity} size={120} fill={fill} radius={10}>
        <Txt fontSize={65} text={text} />
      </Rect>
    );
  };

  // variable to keep track of page fault
  let pageFault: number = 0;

  view.add(
    <>
      {/* inputs label text */}
      <Txt
        ref={inputTextRef}
        text={"FIFO Page Replacement Algorithm"}
        fill={"white"}
        fontSize={100}
        fontWeight={900}
      />
      {/* n label */}
      <Txt
        opacity={0}
        y={10}
        fill={"white"}
        ref={inputLabelRef}
        lineHeight={70}
        text={"Number of Pages, n = 20\nNumber of Frames, frames = 3"}
      />
      {/* pages matrix */}
      <Rect ref={pagesMatrixRef} y={100} opacity={0}>
        <Txt fill={"white"} text={"Incoming Pages:"} y={-320} x={-180} />
        <>
          {range(pages.length).map((row) =>
            range(pages[0].length).map((col) => (
              <Rect
                ref={makeRef(inputs[row], col)}
                size={120}
                x={-280 + 140 * col}
                y={-210 + 140 * row}
                fill={BLUE}
                radius={10}
              >
                <Txt fontSize={65} text={pages[row][col].toString()} />
              </Rect>
            ))
          )}
        </>
      </Rect>
      <CodeBlock
        x={-450}
        y={50}
        opacity={0}
        ref={codeRef}
        language="c++"
        code={code}
        fontSize={30}
      />
      <Rect ref={variableVisualRef} opacity={0} y={0}>
        {/* Set s */}
        <Rect position={[490, 245]} scale={0.7}>
          <Txt fill={"white"} text={"Frame, s:"} y={-100} x={-115} />
          <>
            {range(3).map((i) => (
              <Rect
                ref={makeRef(setRefs, i)}
                size={120}
                x={-140 + 140 * i}
                opacity={i == 0 ? 0.1 : 0}
                stroke={GREEN}
                lineWidth={8}
                radius={10}
              />
            ))}
          </>
        </Rect>
        {/* Queue index */}
        <Rect position={[490, 245]} scale={0.7}>
          <Txt fill={"white"} text={"Queue, index:"} y={120} x={-70} />
          <>
            {range(3).map((i) => (
              <Rect
                ref={makeRef(queueRefs, i)}
                size={120}
                x={-140 + 140 * i}
                y={225}
                opacity={i == 0 ? 0.1 : 0}
                stroke={RED}
                lineWidth={8}
                radius={10}
              />
            ))}
          </>
          {/* Page fault */}
          <Txt
            ref={pageFaultRef}
            fill={"white"}
            text={`Page Faults = ${pageFault}`}
            y={350}
            x={-55}
          />
        </Rect>
      </Rect>
    </>
  );

  // input section
  yield* beginSlide("show input label");
  // change text to inputs
  yield* inputTextRef().text("Inputs", 1.2);

  yield* beginSlide("show inputs");
  // position inputs text
  yield* all(
    inputTextRef().position([430, -470], 1),
    inputTextRef().fontSize(55, 1)
  );
  // show text
  yield* all(inputLabelRef().opacity(1, 0.5), inputLabelRef().y(0, 0.5));

  yield* beginSlide("position inputs");
  // position text
  yield* all(
    inputLabelRef().position([560, -380], 1),
    inputLabelRef().scale(0.7, 1)
  );
  // show matrix
  yield* all(
    pagesMatrixRef().opacity(1, 1, easeOutCubic),
    pagesMatrixRef().y(0, 1, easeOutCubic)
  );
  yield* waitFor(0.5);
  // animation for pages input
  let generators: ThreadGenerator[] = [];
  range(inputs.length).map((row) => {
    for (const ref of inputs[row]) {
      generators.push(
        all(ref.size(110, 0.1).to(120, 0.1), ref.fill(RED, 0.1).to(BLUE, 0.1))
      );
    }
  });
  yield* sequence(0.1, ...generators);

  yield* beginSlide("position matrix");
  yield* all(
    pagesMatrixRef().x(590, 1),
    pagesMatrixRef().y(-80, 1),
    pagesMatrixRef().scale(0.7, 1)
  );

  // code section
  yield* beginSlide("show code");
  yield* all(codeRef().opacity(1, 1), codeRef().y(0, 1));

  yield* beginSlide("highlight method header");
  yield* codeRef().selection(rangeCodeBlock(0, 0, 0, 47), 0.5);

  yield* beginSlide("highlight variable initialization");
  yield* codeRef().selection(lines(1, 3), 0.5);

  yield* beginSlide("show data structures");
  yield* all(variableVisualRef().opacity(1, 1), variableVisualRef().y(-10, 1));

  // first iteration
  yield* beginSlide("highlight for loop");
  yield* codeRef().selection(rangeCodeBlock(5, 0, 5, 30), 0.5);
  yield* waitFor(0.5);
  yield* inputs[0][0].fill(RED, 0.1);

  // animating page fault calculation
  yield* beginSlide("start traversing");
  // select first element
  yield* codeRef().selection(rangeCodeBlock(6, 0, 7, 28), 0.5);

  yield* beginSlide("hightlight inner if statement");
  yield* codeRef().selection(rangeCodeBlock(8, 0, 9, 42), 0.5);

  yield* beginSlide("first step in inner if");
  yield* codeRef().selection(lines(10, 11), 0.5);

  yield* beginSlide("impl");
  setRefs[0].add(createPageComponent(pages[0][0].toString(), GREEN));
  queueRefs[0].add(createPageComponent(pages[0][0].toString(), RED));
  yield* all(setRefs[0].opacity(1, 0.5), queueRefs[0].opacity(1, 0.5));

  yield* beginSlide("second step in inner if");
  yield* codeRef().selection(lines(12), 0.5);

  yield* beginSlide("impl");
  yield* highlightText(pageFaultRef());
  yield* pageFaultRef().text(`Page Faults = ${++pageFault}`, 0.2);

  // second iteration
  yield* beginSlide("continue traversing");
  // select back for loop
  yield* codeRef().selection(rangeCodeBlock(5, 0, 5, 30), 0.5);
  // deselect previous element and select first element
  yield* waitFor(0.5);
  yield* all(inputs[0][0].fill(BLUE, 0.5), inputs[0][1].fill(RED, 0.5));

  yield* beginSlide("highlight first if statement");
  yield* codeRef().selection(rangeCodeBlock(6, 0, 7, 28), 0.5);

  yield* beginSlide("hightlight inner if statement");
  yield* codeRef().selection(rangeCodeBlock(8, 0, 9, 42), 0.5);

  yield* beginSlide("first step in inner if");
  yield* codeRef().selection(lines(10, 11), 0.5);

  yield* beginSlide("impl");
  setRefs[1].add(createPageComponent(pages[0][1].toString(), GREEN));
  queueRefs[1].add(createPageComponent(pages[0][1].toString(), RED));
  yield* all(setRefs[1].opacity(1, 0.5), queueRefs[1].opacity(1, 0.5));

  yield* beginSlide("second step in inner if");
  yield* codeRef().selection(lines(12), 0.5);

  yield* beginSlide("impl");
  yield* highlightText(pageFaultRef());
  yield* pageFaultRef().text(`Page Faults = ${++pageFault}`, 0.2);

  // third iteration
  yield* beginSlide("continue traversing");
  // select back for loop
  yield* codeRef().selection(rangeCodeBlock(5, 0, 5, 30), 0.5);
  // deselect previous element and select first element
  yield* waitFor(0.5);
  yield* all(inputs[0][1].fill(BLUE, 0.5), inputs[0][2].fill(RED, 0.5));

  yield* beginSlide("highlight first if statement");
  yield* codeRef().selection(rangeCodeBlock(6, 0, 7, 28), 0.5);

  yield* beginSlide("hightlight inner if statement");
  yield* codeRef().selection(rangeCodeBlock(8, 0, 9, 42), 0.5);

  yield* beginSlide("first step in inner if");
  yield* codeRef().selection(lines(10, 11), 0.5);

  yield* beginSlide("impl");
  setRefs[2].add(createPageComponent(pages[0][2].toString(), GREEN));
  queueRefs[2].add(createPageComponent(pages[0][2].toString(), RED));
  yield* all(setRefs[2].opacity(1, 0.5), queueRefs[2].opacity(1, 0.5));

  yield* beginSlide("second step in inner if");
  yield* codeRef().selection(lines(12), 0.5);

  yield* beginSlide("impl");
  yield* highlightText(pageFaultRef());
  yield* pageFaultRef().text(`Page Faults = ${++pageFault}`, 0.2);

  // fourth iteration
  yield* beginSlide("continue traversing");
  // select back for loop
  yield* codeRef().selection(rangeCodeBlock(5, 0, 5, 30), 0.5);
  // deselect previous element and select first element
  yield* waitFor(0.5);
  yield* all(inputs[0][2].fill(BLUE, 0.5), inputs[0][3].fill(RED, 0.5));

  yield* beginSlide("highlight first if statement");
  yield* codeRef().selection(rangeCodeBlock(6, 0, 7, 28), 0.5);

  // frame is full case
  yield* beginSlide("hightlight second if statement");
  yield* codeRef().selection(lines(14), 0.5);

  yield* beginSlide("hightlight inner if statement");
  yield* codeRef().selection(rangeCodeBlock(15, 0, 15, 43), 0.5);

  yield* beginSlide("first step in inner if");
  yield* codeRef().selection(lines(16, 18), 0.5);

  // popping
  yield* beginSlide("impl");
  yield* all(
    setRefs[0].children()[0].opacity(0, 0.5),
    queueRefs[0].children()[0].opacity(0, 0.5)
  );
  setRefs[0].removeChildren();
  queueRefs[0].removeChildren();

  // forward queue item
  yield* beginSlide("forward queue item");
  yield* all(
    queueRefs[1].children()[0].opacity(0, 0.5),
    queueRefs[2].children()[0].opacity(0, 0.5)
  );
  queueRefs[0].add(queueRefs[1].children());
  queueRefs[1].add(queueRefs[2].children());
  yield* all(
    queueRefs[0].children()[0].opacity(1, 0.5),
    queueRefs[1].children()[0].opacity(1, 0.5)
  );

  yield* beginSlide("second step in inner if");
  yield* codeRef().selection(lines(19), 0.5);

  yield* beginSlide("impl");
  setRefs[0].add(createPageComponent(pages[0][3].toString(), GREEN, 0));
  yield* all(setRefs[0].children()[0].opacity(1, 0.5));

  yield* beginSlide("third step in inner if");
  yield* codeRef().selection(lines(20), 0.5);

  yield* beginSlide("impl");
  queueRefs[2].add(createPageComponent(pages[0][3].toString(), RED, 0));
  yield* all(queueRefs[2].children()[0].opacity(1, 0.5));

  yield* beginSlide("fourth step in inner if");
  yield* codeRef().selection(lines(21), 0.5);

  yield* beginSlide("impl");
  yield* highlightText(pageFaultRef());
  yield* pageFaultRef().text(`Page Faults = ${++pageFault}`, 0.2);

  // fourth iteration
  yield* beginSlide("continue traversing");
  // select back for loop
  yield* codeRef().selection(rangeCodeBlock(5, 0, 5, 30), 0.5);
  // deselect previous element and select first element
  yield* waitFor(0.5);
  yield* all(inputs[0][3].fill(BLUE, 0.5), inputs[0][4].fill(RED, 0.5));

  yield* beginSlide("highlight first if statement");
  yield* codeRef().selection(rangeCodeBlock(6, 0, 7, 28), 0.5);

  // page already in frame case
  yield* beginSlide("hightlight second if statement");
  yield* codeRef().selection(lines(14), 0.5);

  yield* beginSlide("hightlight inner if statement");
  yield* codeRef().selection(rangeCodeBlock(15, 0, 15, 43), 0.5);

  // create data structure to demo using loop
  const s: number[] = [2, 0, 1];
  const q: number[] = [0, 1, 2];
  // store code generated animation
  generators = [];
  // fifth and so on iteration
  for (let i = 5; i < 20; i++) {
    const prevRow = Math.floor((i - 1) / 5);
    const prevCol = Math.floor((i - 1) % 5);
    const row = Math.floor(i / 5);
    const col = Math.floor(i % 5);
    const curr = pages[row][col];
    generators.push(
      chain(
        // highlight for loop
        codeRef().selection(rangeCodeBlock(5, 0, 5, 30), 0.4),
        // select current page and deselect previous page
        all(
          inputs[prevRow][prevCol].fill(BLUE, 0.4),
          inputs[row][col].fill(RED, 0.4)
        )
      )
    );
    generators.push(
      // play no empty frame anim
      chain(
        codeRef().selection(rangeCodeBlock(6, 0, 7, 28), 0.4),
        codeRef().selection(lines(14), 0.4),
        // highlight inner if
        codeRef().selection(rangeCodeBlock(15, 0, 15, 43), 0.4)
      )
    );
    // check whether page already exists in the set
    if (!s.includes(curr)) {
      // find index of to-be-pop element in s
      const sPopIndex = s.indexOf(q[0]);
      // if not exist, do pop routine
      generators.push(
        chain(
          all(
            // highlight pop code
            codeRef().selection(lines(16, 18), 0.4),
            // fades out first element in queue and poped element in set
            all(
              setRefs[sPopIndex].children()[0].opacity(0, 0.4),
              queueRefs[0].children()[0].opacity(0, 0.4)
            )
          )
        )
      );
      // update queue and set
      s.splice(sPopIndex, 1);
      q.shift();

      generators.push(
        chain(
          // fades out queue item
          all(
            queueRefs[1].children()[0].opacity(0, 0.4),
            queueRefs[2].children()[0].opacity(0, 0.4)
          ),
          // update text
          all(
            (queueRefs[0].children()[0].children()[0] as Txt).text(
              q[0].toString(),
              0
            ),
            (queueRefs[1].children()[0].children()[0] as Txt).text(
              q[1].toString(),
              0
            )
          ),
          // fades in queue item
          all(
            queueRefs[0].children()[0].opacity(1, 0.4),
            queueRefs[1].children()[0].opacity(1, 0.4)
          )
        )
      );

      // update queue and set
      s.splice(sPopIndex, 0, curr);
      q.push(curr);

      generators.push(
        chain(
          // update text
          (setRefs[sPopIndex].children()[0].children()[0] as Txt).text(
            curr.toString(),
            0
          ),
          // inject page into set
          all(
            codeRef().selection(lines(19), 0.4),
            // fades in element
            setRefs[sPopIndex].children()[0].opacity(1, 0.4)
          ),
          // update text
          (queueRefs[2].children()[0].children()[0] as Txt).text(
            curr.toString(),
            0
          ),
          // inject page into queue
          all(
            codeRef().selection(lines(20), 0.4),
            queueRefs[2].children()[0].opacity(1, 0.4)
          ),
          // update page fault
          all(
            codeRef().selection(lines(21), 0.4),
            chain(
              highlightText(pageFaultRef()),
              pageFaultRef().text(`Page Faults = ${++pageFault}`, 0.4)
            )
          )
        )
      );
    }
  }

  yield* beginSlide("play all anim");
  yield* chain(...generators);

  yield* beginSlide("highlight return statement");
  yield* codeRef().selection(lines(26, 26), 0.4);

  yield* beginSlide("end");
});
