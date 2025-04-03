import React, { useEffect, useState, useRef } from 'react';
import { getServidores } from '../../services/fireStore';
import styles from './BuscarPeriodos.module.css';
import removeAccents from 'remove-accents';

import DropdownCheckbox from '../../components/DropdownCheckbox';
import ScrollToTopButton from '../../components/ScrollButton';
import Navbar from '../../components/Navbar';
import GerarPDFButton from '../../components/GerarPDFButton';
import toast from 'react-hot-toast';

const BuscarPeriodos = () => {
  const [servidores, setServidores] = useState([]);
  const [dadosFiltrados, setDadosFiltrados] = useState([]);
  const [filtroNome, setFiltroNome] = useState('');
  const [filtroCargos, setFiltroCargos] = useState([]);
  const [filtroLotacao, setFiltroLotacao] = useState('');
  const [filtroMes, setFiltroMes] = useState('');
  const [filtroDataInicio, setFiltroDataInicio] = useState('');
  const [filtroDataFim, setFiltroDataFim] = useState('');
  const [filtroTipos, setFiltroTipos] = useState('');
  const [tipoParaPDF, setTipoParaPDF] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const servidoresData = await getServidores();

        // Ordenar servidores por nome
        const servidoresOrdenados = servidoresData.sort((a, b) =>
          a.nome.localeCompare(b.nome)
        );

        setServidores(servidoresOrdenados);
      } catch (error) {
        toast.error('Erro ao buscar dados dos servidores e licenças:', error);
      }
    };
    fetchData();
  }, []);

  const toggleCargo = (cargo) => {
    setFiltroCargos((prev) =>
      prev.includes(cargo) ? prev.filter((c) => c !== cargo) : [...prev, cargo]
    );
  };

  useEffect(() => {
    let filtrados = servidores;

    if (filtroNome) {
      filtrados = filtrados.filter((servidor) =>
        removeAccents(servidor.nome.toLowerCase()).includes(
          removeAccents(filtroNome.toLowerCase())
        )
      );
    }

    if (filtroCargos.length > 0) {
      filtrados = filtrados.filter((servidor) =>
        filtroCargos.includes(servidor.cargo)
      );
    }

    if (filtroLotacao) {
      filtrados = filtrados.filter(
        (servidor) => servidor.lotacao === filtroLotacao
      );
    }

    if (filtroTipos) {
      filtrados = filtrados.filter((servidor) =>
        servidor.periodos.some((periodo) => periodo.tipo === filtroTipos)
      );
    }

    // Filtro por mês selecionado
    if (filtroMes) {
      filtrados = filtrados.filter((servidor) => {
        // Filtrar os períodos que se encaixam no mês selecionado
        const periodosNoMes = servidor.periodos.filter((periodo) => {
          if (periodo.dataInicio) {
            const inicio = periodo.dataInicio.seconds
              ? new Date(periodo.dataInicio.seconds * 1000)
              : new Date(periodo.dataInicio);
            const inicioMes = inicio.getMonth() + 1;

            const fimMes = periodo.dataFim
              ? periodo.dataFim.seconds
                ? new Date(periodo.dataFim.seconds * 1000).getMonth() + 1
                : new Date(periodo.dataFim).getMonth() + 1
              : inicioMes;

            return (
              inicioMes === parseInt(filtroMes, 10) ||
              fimMes === parseInt(filtroMes, 10)
            );
          }

          // Verifica abonos com uma única data
          if (periodo.tipo === 'abono' && periodo.data) {
            const dataAbono = periodo.data.seconds
              ? new Date(periodo.data.seconds * 1000)
              : new Date(periodo.data);
            const abonosMes = dataAbono.getMonth() + 1;
            return abonosMes === parseInt(filtroMes, 10);
          }

          return false;
        });

        // Retorna apenas os servidores com pelo menos um período no mês filtrado
        return periodosNoMes.length > 0;
      });
    }

    if (filtroDataInicio && filtroDataFim) {
      const dataInicio = new Date(filtroDataInicio);
      const dataFim = new Date(filtroDataFim);

      filtrados = filtrados.map((servidor) => {
        const periodosNoIntervalo = servidor.periodos.filter((periodo) => {
          if (
            periodo.dataInicio &&
            periodo.dataInicio.seconds !== undefined &&
            periodo.dataFim &&
            periodo.dataFim.seconds !== undefined
          ) {
            const inicio = new Date(periodo.dataInicio.seconds * 1000);
            const fim = new Date(periodo.dataFim.seconds * 1000);
            return inicio >= dataInicio && fim <= dataFim;
          }
          return false;
        });

        return {
          ...servidor,
          periodos: periodosNoIntervalo.length > 0 ? periodosNoIntervalo : [],
        };
      });
    }

    setDadosFiltrados(filtrados);
  }, [
    filtroNome,
    filtroCargos,
    filtroLotacao,
    filtroDataInicio,
    filtroDataFim,
    filtroTipos,
    filtroMes,
    servidores,
  ]);

  const handleClearFilters = () => {
    setFiltroNome('');
    setFiltroCargos([]);
    setFiltroLotacao('');
    setFiltroDataInicio('');
    setFiltroDataFim('');
    setFiltroTipos('');
    setFiltroMes('');
    setDadosFiltrados(servidores);
    setTipoParaPDF('');
  };

  return (
    <div>
      <div>
        <div className={styles.navbar}>
          <Navbar />
        </div>
        <div className={styles.content}>
          <h1>Buscar Períodos</h1>

          <div className={styles.options}>
            <DropdownCheckbox
              options={Array.from(
                new Set(servidores.map((servidor) => servidor.cargo))
              )}
              selectedOptions={filtroCargos}
              toggleOption={toggleCargo}
            />

            {/* Filtros */}

            <div className={styles.select}>
              <label>Nome:</label>
              <select
                value={filtroNome}
                onChange={(e) => setFiltroNome(e.target.value)}
              >
                <option value="">Todos</option>
                {Array.from(
                  new Set(servidores.map((servidor) => servidor.nome))
                ).map((nome, index) => (
                  <option key={index} value={nome}>
                    {nome}
                  </option>
                ))}
              </select>

              <label>Lotação:</label>
              <select
                value={filtroLotacao}
                onChange={(e) => setFiltroLotacao(e.target.value)}
              >
                <option value="">Todas</option>
                {Array.from(
                  new Set(servidores.map((servidor) => servidor.lotacao))
                ).map((lotacao, index) => (
                  <option key={index} value={lotacao}>
                    {lotacao}
                  </option>
                ))}
              </select>

              <label>Mês:</label>
              <select
                value={filtroMes}
                onChange={(e) => setFiltroMes(e.target.value)}
              >
                <option value="">Todos</option>
                <option value="1">Janeiro</option>
                <option value="2">Fevereiro</option>
                <option value="3">Março</option>
                <option value="4">Abril</option>
                <option value="5">Maio</option>
                <option value="6">Junho</option>
                <option value="7">Julho</option>
                <option value="8">Agosto</option>
                <option value="9">Setembro</option>
                <option value="10">Outubro</option>
                <option value="11">Novembro</option>
                <option value="12">Dezembro</option>
              </select>
            </div>
          </div>
          {/* Botão de Limpar Pesquisa */}
          <div className={styles.actions}>
            <button onClick={handleClearFilters} className={styles.clean}>
              Limpar Pesquisa
            </button>
            <GerarPDFButton
              dadosFiltrados={dadosFiltrados}
              tipoParaPDF={tipoParaPDF} // Passa o tipo selecionado
            />
          </div>
        </div>

        <div className={styles.legendaContainer}>
          <h4 className={styles.legendaTitulo}>Legenda:</h4>
          <div className={styles.legendaItens}>
            <div className={styles.legendaItem}>
              <div
                className={`${styles.legendaCor} ${styles.legendaAndamento}`}
              ></div>
              <span>Em andamento</span>
            </div>

            <div className={styles.legendaItem}>
              <div
                className={`${styles.legendaCor} ${styles.legendaProximo}`}
              ></div>
              <span>Próximo (em até 15 dias)</span>
            </div>

            <div className={styles.legendaItem}>
              <div
                className={`${styles.legendaCor} ${styles.legendaFuturo}`}
              ></div>
              <span>Futuro (além de 15 dias)</span>
            </div>

            <div className={styles.legendaItem}>
              <div
                className={`${styles.legendaCor} ${styles.legendaPassado}`}
              ></div>
              <span>Passado</span>
            </div>
          </div>
        </div>

        {/* Tabela de Resultados */}
        <table className={styles.table} id="tabelaPeriodos">
          <thead>
            <tr className={styles.titles}>
              <th>Nome</th>
              <th>Cargo</th>
              <th>Lotação</th>
              <th>Matrícula</th>
              <th>Férias</th>
              <th>Abonos</th>
              <th>Licenças-Prêmio</th>
            </tr>
          </thead>
          <tbody>
            {dadosFiltrados.length > 0 ? (
              dadosFiltrados.map((servidor) => (
                <tr key={servidor.id}>
                  <td>{servidor.nome}</td>
                  <td>{servidor.cargo}</td>
                  <td>{servidor.lotacao}</td>
                  <td>{servidor.matricula}</td>

                  {/* Férias */}
                  <td>
                    {servidor.periodos.filter(
                      (periodo) => periodo.tipo === 'ferias'
                    ).length > 0
                      ? servidor.periodos
                          .filter((periodo) => periodo.tipo === 'ferias')
                          .map((periodo, index) => {
                            const dataInicio = periodo.dataInicio
                              ? typeof periodo.dataInicio === 'string'
                                ? new Date(periodo.dataInicio + 'T00:00:00')
                                : new Date(periodo.dataInicio.seconds * 1000)
                              : null;
                            const dataFim = periodo.dataFim
                              ? typeof periodo.dataFim === 'string'
                                ? new Date(periodo.dataFim + 'T23:59:59')
                                : new Date(periodo.dataFim.seconds * 1000)
                              : null;

                            const hoje = new Date();
                            hoje.setHours(0, 0, 0, 0); // Zera a hora para evitar problemas de fuso horário

                            let periodoStatus = '';

                            if (dataInicio && dataFim) {
                              if (hoje >= dataInicio && hoje <= dataFim) {
                                periodoStatus = 'andamento'; // Período em andamento
                              } else if (hoje < dataInicio) {
                                const diasParaInicio = Math.ceil(
                                  (dataInicio - hoje) / (1000 * 60 * 60 * 24)
                                );

                                if (diasParaInicio <= 15) {
                                  periodoStatus = 'proximo'; // Próximo em até 15 dias
                                } else {
                                  periodoStatus = 'futuro'; // Futuro além de 15 dias
                                }
                              } else if (hoje > dataFim) {
                                periodoStatus = 'passado'; // Período passado
                              }
                            }

                            const diffDays =
                              dataInicio && dataFim
                                ? Math.floor(
                                    (dataFim.getTime() - dataInicio.getTime()) /
                                      (1000 * 60 * 60 * 24)
                                  ) + 1 // Inclui o último dia
                                : null;

                            // Exibição das datas
                            return (
                              <div
                                key={index}
                                className={`periodo-ferias ${periodoStatus}`}
                                style={{
                                  borderBottom: '1px solid #ccc',
                                  padding: '4px',
                                  backgroundColor:
                                    periodoStatus === 'andamento'
                                      ? 'lightblue'
                                      : periodoStatus === 'proximo'
                                      ? 'yellow'
                                      : periodoStatus === 'futuro'
                                      ? 'lightgreen'
                                      : periodoStatus === 'passado'
                                      ? 'lightgray'
                                      : 'transparent',
                                }}
                              >
                                <p>
                                  {dataInicio
                                    ? dataInicio.toLocaleDateString()
                                    : 'Data de Início inválida'}{' '}
                                  a{' '}
                                  {dataFim
                                    ? dataFim.toLocaleDateString()
                                    : 'Data de Fim inválida'}{' '}
                                  {diffDays !== null
                                    ? `(${diffDays} dias)`
                                    : '(Dias não calculados)'}
                                </p>
                              </div>
                            );
                          })
                      : 'Sem afastamento registrado'}
                  </td>

                  {/* Abonos */}
                  <td>
                    {(() => {
                      // Agora usa servidor.periodos ao invés de servidor.ferias
                      const abonosFiltrados = servidor.periodos
                        ? servidor.periodos.filter(
                            (periodo) => periodo.tipo === 'abono'
                          )
                        : [];

                      if (abonosFiltrados.length === 0) {
                        return <p>Nenhum abono registrado</p>;
                      }

                      return abonosFiltrados.map((periodo, index) => {
                        const dataAbono = periodo.data
                          ? new Date(periodo.data + 'T00:00:00')
                          : null;

                        const hoje = new Date();
                        hoje.setHours(0, 0, 0, 0);

                        let periodoStatus = '';

                        if (dataAbono) {
                          if (
                            hoje.toDateString() === dataAbono.toDateString()
                          ) {
                            periodoStatus = 'andamento';
                          } else if (hoje < dataAbono) {
                            const diasParaInicio = Math.ceil(
                              (dataAbono - hoje) / (1000 * 60 * 60 * 24)
                            );
                            periodoStatus =
                              diasParaInicio <= 15 ? 'proximo' : 'futuro';
                          } else if (hoje > dataAbono) {
                            periodoStatus = 'passado';
                          }
                        }

                        return (
                          <div
                            key={index}
                            className={`periodo-abono ${periodoStatus}`}
                            style={{
                              borderBottom: '1px solid #ccc',
                              padding: '4px',
                              backgroundColor:
                                periodoStatus === 'andamento'
                                  ? 'lightblue'
                                  : periodoStatus === 'proximo'
                                  ? 'yellow'
                                  : periodoStatus === 'futuro'
                                  ? 'lightgreen'
                                  : periodoStatus === 'passado'
                                  ? 'lightgray'
                                  : 'transparent',
                            }}
                          >
                            <p>
                              {index + 1}º Abono -{' '}
                              {dataAbono
                                ? dataAbono.toLocaleDateString()
                                : 'Data Inválida'}
                            </p>
                          </div>
                        );
                      });
                    })()}
                  </td>

                  {/* Licenças-Prêmio */}
                  <td>
                    {(() => {
                      // Filtra os períodos do tipo "licenca-premio"
                      const licencasPremioFiltradas = servidor.periodos
                        ? servidor.periodos.filter(
                            (periodo) => periodo.tipo === 'licenca-premio'
                          )
                        : [];

                      // Se não houver licenças-prêmio, exibe a mensagem
                      if (licencasPremioFiltradas.length === 0) {
                        return <p>Nenhuma licença-prêmio registrada</p>;
                      }

                      return licencasPremioFiltradas.map((periodo, index) => {
                        const dataInicio = periodo.dataInicio
                          ? new Date(periodo.dataInicio + 'T00:00:00')
                          : null;
                        const dataFim = periodo.dataFim
                          ? new Date(periodo.dataFim + 'T23:59:59')
                          : null;

                        const hoje = new Date();
                        hoje.setHours(0, 0, 0, 0);

                        let periodoStatus = '';

                        if (dataInicio && dataFim) {
                          if (hoje >= dataInicio && hoje <= dataFim) {
                            periodoStatus = 'andamento';
                          } else if (hoje < dataInicio) {
                            const diasParaInicio = Math.ceil(
                              (dataInicio - hoje) / (1000 * 60 * 60 * 24)
                            );
                            periodoStatus =
                              diasParaInicio <= 15 ? 'proximo' : 'futuro';
                          } else if (hoje > dataFim) {
                            periodoStatus = 'passado';
                          }
                        }

                        const diffDays =
                          dataInicio && dataFim
                            ? Math.floor(
                                (dataFim - dataInicio) / (1000 * 60 * 60 * 24)
                              ) + 1
                            : null;

                        return (
                          <div
                            key={index}
                            className={`periodo-licenca ${periodoStatus}`}
                            style={{
                              borderBottom: '1px solid #ccc',
                              padding: '4px',
                              backgroundColor:
                                periodoStatus === 'andamento'
                                  ? 'lightblue'
                                  : periodoStatus === 'proximo'
                                  ? 'yellow'
                                  : periodoStatus === 'futuro'
                                  ? 'lightgreen'
                                  : periodoStatus === 'passado'
                                  ? 'lightgray'
                                  : 'transparent',
                            }}
                          >
                            <p>
                              {dataInicio
                                ? dataInicio.toLocaleDateString()
                                : 'Data Inválida'}{' '}
                              a{' '}
                              {dataFim
                                ? dataFim.toLocaleDateString()
                                : 'Data Inválida'}{' '}
                              ({diffDays} dias)
                            </p>
                          </div>
                        );
                      });
                    })()}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="7">Nenhum resultado encontrado.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <div>
        <ScrollToTopButton />
      </div>
    </div>
  );
};

export default BuscarPeriodos;
