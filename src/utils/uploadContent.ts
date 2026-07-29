import { pick } from "@react-native-documents/picker";

const [file] = await pick({
  mode: "open",
});

console.log(JSON.stringify(file, null, 2));