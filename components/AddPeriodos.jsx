import { useState } from 'react';
import {
  addFerias,
  addAbono,
  addLicencaMedica,
  addLicencaPremio,
} from '../services/fireStore';

const AddPeriodos = () => {
  const [periodo, setPeriodo] = useState({
    tipo: 'ferias', // pode ser 'ferias', 'abono', 'licencaPremio', 'licencaMedica'
    dataInicio: '',
    dataFim: '',
    dias: 0,
    motivo: '',
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setPeriodo((prevPeriodo) => ({
      ...prevPeriodo,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

   

    
    try {
      switch (periodo.tipo) {
        case 'ferias':
          await addFerias(servidorId, {
            dataInicio: periodo.dataInicio,
            dataFim: periodo.dataFim,
            dias: parseInt(periodo.dias, 10),
          });
          break;
        case 'abono':
          await addAbono(servidorId, {
            data: periodo.dataInicio,
            dias: parseInt(periodo.dias, 10),
          });
          break;
        case 'licencaPremio':
          await addLicencaPremio(servidorId, {
            dataInicio: periodo.dataInicio,
            dataFim: periodo.dataFim,
            dias: parseInt(periodo.dias, 10),
          });
          break;
        case 'licencaMedica':
          await addLicencaMedica(servidorId, {
            dataInicio: periodo.dataInicio,
            dataFim: periodo.dataFim,
            motivo: periodo.motivo,
          });
          break;
        default:
          console.error('Tipo de período inválido');
      }
      alert('Período adicionado com sucesso!');
    } catch (error) {
      console.error('Erro ao adicionar período: ', error);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div>
        <label>
          Tipo de período:
          <select name="tipo" value={periodo.tipo} onChange={handleChange}>
            <option value="férias">Férias</option>
            <option value="abono">Abono</option>
            <option value="licencaPremio">Licença-Prêmio</option>
            <option value="licencaMedica">Licença Médica</option>
          </select>
        </label>
      </div>
      <div>
        <label>
          Data Início:
          <input type="date" name="dataInicio" value={periodo.dataInicio} />
        </label>
      </div>
      {periodo.tipo !== 'abono' && (
        <div>
          <label>
            Data Fim:
            <input
              type="date"
              name="dataFim"
              value={periodo.dataFim}
              onChange={handleChange}
              requered
            />
          </label>
        </div>
      )}
      {periodo.tipo !== 'licencaMedica' && (
        <div>
          <label>
            Dias:
            <input
              type="number"
              name="dias"
              value={periodo.dias}
              onChange={handleChange}
              required
            />
          </label>
        </div>
      )}
      {periodo.tipo === 'licencaMedica' && (
        <div>
          <label>
            Motivo:
            <input
              type="text"
              name="motivo"
              value={periodo.motivo}
              onChange={handleChange}
            />
          </label>
        </div>
      )}
      <button type="submit">Adicionar Período</button>
    </form>
  );
};

export default AddPeriodos;
