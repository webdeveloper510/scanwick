import type { BorrowersApi } from "./api";
import { httpBorrowersApi } from "./api";
import { BorrowersScreen } from "./BorrowersScreen";

type Props = {
  api?: BorrowersApi;
};

export function App({ api = httpBorrowersApi }: Props) {
  return <BorrowersScreen api={api} />;
}
