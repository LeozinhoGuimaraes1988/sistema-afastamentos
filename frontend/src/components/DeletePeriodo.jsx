import toast from 'react-hot-toast';
import { deletePeriodo } from '../services/fireStore';

const DeletePeriodo = ({ periodoId, onClose }) => {
  const handleDelete = async () => {
    try {
      await deletePeriodo(periodoId);
      toast.success('Período excluído com sucesso!');
      onClose(); // Fecha o modal ou componente de confirmação
    } catch (error) {
      console.error(error);
    }
  };
  return (
    <div>
      <p>Tem certeza que deseja excluir este período?</p>
      <button onClick={handleDelete}>Excluir</button>
      <button onClick={onClose}>Cancelar</button>
    </div>
  );
};

export default DeletePeriodo;
