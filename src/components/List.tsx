import { useState, useRef, useEffect } from 'preact/hooks';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { SketchPicker, ColorResult } from 'react-color';
import { nanoid } from 'nanoid';
import { FaSort } from 'react-icons/fa';
import Modal from 'react-modal';
import Button from './shared/Button';

export type ColorItem = {
  id: string;
  color: string;
  text: string;
}

type ActiveColor = ColorItem | null;

type ListProps = {
  onCompare: (editedItems: ColorItem[]) => void;
  onChangeCosmetic: (updatedItem: ColorItem, newIndex: number) => void; // Add newIndex parameter
  loadingScore: boolean;
};

const initialColorItems: ColorItem[] = [
  { "id": nanoid(), "color": "#F3F3A4", "text": "Manchester Football" },
  { "id": nanoid(), "color": "#fabc4b", "text": "Man Utd" },
  { "id": nanoid(), "color": "orange", "text": "Red Devils" },
  { "id": nanoid(), "color": "#DA291C", "text": "Manchester United" },
  { "id": nanoid(), "color": "#6CABDD", "text": "Manchester City" },
  { "id": nanoid(), "color": "blue", "text": "ManCity" },
  { "id": nanoid(), "color": "#000000", "text": "Marcus Rashford" },
  { "id": nanoid(), "color": "#FFC0CB", "text": "kevin de bruyne" }
]

function List({ onCompare, onChangeCosmetic, loadingScore }: ListProps) {
  const [colors, setColors] = useState<ColorItem[]>(initialColorItems);
  const [activeColor, setActiveColor] = useState<ActiveColor>(null);
  const [editedItems, setEditedItems] = useState<ColorItem[]>(colors);

  const lastInputRef = useRef<HTMLInputElement | null>(null);
  const [latestAddedId, setLatestAddedId] = useState<string | null>(null);

  useEffect(() => {
    console.log(latestAddedId)
    if (lastInputRef.current && latestAddedId !== null) {
      lastInputRef.current.focus();
    }
  }, [latestAddedId]);

  const handleDragEnd = (result: any) => {
    if (!result.destination) return;
    const items = Array.from(colors);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);
    setColors(items);
    onChangeCosmetic(reorderedItem, result.destination.index); // Pass the new index
  };

  const handleColorChange = (color: ColorResult, id: string) => {
    const updatedColors = colors.map((item) =>
      item.id === id ? { ...item, color: color.hex } : item
    );
    setColors(updatedColors);

    const updatedItem = updatedColors.find((item) => item.id === id);
    const newIndex = updatedColors.findIndex((item) => item.id === id);
    if (updatedItem && newIndex !== -1) {
      onChangeCosmetic(updatedItem, newIndex); // Pass the new index
    }
  };


  const handleAddItem = () => {
    const newItem = { id: nanoid(), color: randomColor(), text: `` };
    setColors([...colors, newItem]);
    setLatestAddedId(newItem.id); // Set the latest added ID every time a new item is added
  };

  const handleTextChange = (e: any, id: string) => {
    const updatedColors = colors.map((item) =>
      item.id === id ? { ...item, text: e.target.value } : item
    );
    setColors(updatedColors);

    const updatedItem = updatedColors.find((item) => item.id === id);
    if (updatedItem) {
      setEditedItems((prevItems) => {
        const existingItemIndex = prevItems.findIndex((item) => item.id === id);
        if (existingItemIndex !== -1) {
          return [
            ...prevItems.slice(0, existingItemIndex),
            updatedItem,
            ...prevItems.slice(existingItemIndex + 1),
          ];
        } else {
          return [...prevItems, updatedItem];
        }
      });
    }
  };

  const handleCompare = () => {
    const nonEmptyItems = colors.filter((item) => item.text.trim() !== '');
    setColors(nonEmptyItems);
    onCompare(nonEmptyItems); // Pass the non-empty items array
    setEditedItems([]);
  };



  return (
    <div class="flex flex-col w-full">
      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId="colors">
          {(provided) => (
            <ul {...provided.droppableProps} ref={provided.innerRef} class="w-full flex-1 overflow-auto">
              {colors.map((colorItem, index) => (
                <ColorListItem
                  key={colorItem.id}
                  colorItem={colorItem}
                  index={index}
                  activeColor={activeColor}
                  setActiveColor={setActiveColor}
                  handleColorChange={handleColorChange}
                  handleTextChange={handleTextChange}
                  inputRef={index === colors.length - 1 ? lastInputRef : null}
                />
              ))}
              {provided.placeholder}
            </ul>
          )}
        </Droppable>
      </DragDropContext>
      <AddCompareButtons
        handleAddItem={handleAddItem}
        handleCompare={handleCompare}
        isCompareDisabled={colors.length === 0 || editedItems.length === 0}
        loadingScore={loadingScore}
      />
    </div>
  );

}

function ColorListItem({ colorItem, index, activeColor, setActiveColor, handleColorChange, handleTextChange, inputRef }: any) {
  const { id, color, text } = colorItem;
  const colorPickerRef = useRef<HTMLDivElement | null>(null);

  const handleClickOutside = (event: MouseEvent) => {
    if (
      colorPickerRef.current &&
      !colorPickerRef.current.contains(event.target as Node)
    ) {
      setActiveColor(null);
    }
  };

  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <Draggable key={id} draggableId={id} index={index}>
      {(provided) => (
        <li
          {...provided.draggableProps}
          ref={provided.innerRef}
          className="bg-white py-2 px-4 rounded-2xl flex items-center relative w-full"
        >
          <div
            {...provided.dragHandleProps}
            className="mr-3 cursor-grab flex items-center"
          >
            <FaSort size={16} />
          </div>
          <div
            className="rounded mr-2 aspect-square"
            style={{
              backgroundColor: color,
              width: '1.5rem',
              height: '1.5rem',
            }}
            onClick={() => setActiveColor({ id, color, text })}
          />
          <input
            ref={inputRef}
            type="text"
            value={text}
            onChange={(e) => handleTextChange(e, id)}
            className="ml-3 focus:outline-none focus:ring-0 py-2 px-4 rounded-lg flex-grow bg-gray-100"
          />

          {activeColor && activeColor.id === id && (
            <div
              ref={colorPickerRef}
              className="absolute z-10 top-full left-0"
            >
              <SketchPicker
                color={color}
                onChange={(color) => handleColorChange(color, id)}
              />
            </div>
          )}
        </li>
      )}
    </Draggable>
  );
}

function AddCompareButtons({ handleAddItem, handleCompare, isCompareDisabled, loadingScore }: any) {
  const [modalIsOpen, setModalIsOpen] = useState(false);

  const openModal = () => {
    setModalIsOpen(true);
  };

  const closeModal = () => {
    setModalIsOpen(false);
  };

  return (
    <div class="flex mt-3 px-4">
      <Button onClick={openModal} type="primary" className='bg-purple-500 hover:bg-purple-600 font-bold'>
        WTF is this?
      </Button>
      <Modal
        isOpen={modalIsOpen}
        onRequestClose={closeModal}
        contentLabel="Modal"
        style={{
          content: {
            width: '600px',
            margin: 'auto',
            border: "none",
            backgroundColor: "rgb(245 243 255)",
            cursor: "auto",
            height: "fit-content",
          },
          overlay: {
            cursor: "pointer"
          }
        }}
      >
        <div className="flex flex-col w-full h-fit">
          <h2 className="text-3xl text-purple-500 font-bold font-sans mb-4">WTF is this?</h2>
          <p class="mb-3">This site lets you see how text-based AIs (like ChatGPT) understand text. You can enter two or more words, phrases or pieces of text and the site will tell you how similar or different that AI model thinks they are. It's a cool way to peek into the 'mind' of the AI imo.</p>
          <p>One of the models (text-embedding-ada-002) is actually from OpenAI and is probably very-very similar to how ChatGPT views text.</p>
          <Button className="ml-auto mt-3" onClick={closeModal}>Close</Button>
        </div>
      </Modal>

      <Button onClick={handleAddItem} type="secondary" className='ml-auto'>
        Add
      </Button>
      <Button onClick={handleCompare} type="primary" className="ml-3" disabled={isCompareDisabled}>
        {loadingScore && <span className="circular-loader mr-2"></span>} {/* Use the custom circular loader */}
        Compare
      </Button>
    </div>
  );
}


function randomColor(): string {
  return '#' + Math.floor(Math.random() * 16777215).toString(16);
}

export default List;
