/**
 * NeuralNetworkLayer - abstract base for every layer in a NeuralNetwork.
 *
 * A layer is a VGroup of node mobjects (circles, feature-map squares, a pixel
 * grid). The NeuralNetwork places layers left to right and draws connection
 * lines between the anchor points of adjacent layers. Each concrete layer
 * exposes the same small interface so the network can treat them uniformly.
 */

import * as THREE from 'three';
import { VGroup } from '../../core/VGroup';
import { VMobject } from '../../core/VMobject';
import { Vector3Tuple } from '../../core/Mobject';

export abstract class NeuralNetworkLayer extends VGroup {
  /**
   * The node mobjects of this layer, in top-to-bottom order.
   *
   * A connection attaches to a node's center, so this list defines how many
   * edges the network draws to the next layer. It may be empty (a layer with
   * zero nodes), which the network treats as "no connections".
   */
  protected _nodes: VMobject[] = [];

  /**
   * A container flattens its own transform into its children instead of baking
   * geometry, exactly like GenericGraph. This keeps node centers and the
   * connection lines (which the network positions in world space) correct when
   * a scene normalizes the family.
   */
  override normalizeTransform(worldMatrix: THREE.Matrix4 = this._ownMatrix()): this {
    return this._flattenAsContainer(worldMatrix);
  }

  /**
   * Get the node mobjects of this layer.
   * @returns The nodes in top-to-bottom order (an empty array for a 0-node layer).
   */
  getNodes(): VMobject[] {
    return [...this._nodes];
  }

  /**
   * Get the number of nodes (connection anchors) in this layer.
   */
  get numNodes(): number {
    return this._nodes.length;
  }

  /**
   * Get the world-space anchor point of each node, in node order.
   *
   * The network calls this after it has positioned the layer, so the centers
   * already include the layer's placement offset.
   * @returns One center per node (an empty array for a 0-node layer).
   */
  nodeAnchors(): Vector3Tuple[] {
    return this._nodes.map((node) => node.getCenter());
  }

  /**
   * Get the horizontal extent used to space this layer from its neighbours.
   *
   * It must return a positive number even when the layer has zero nodes, so the
   * network can lay out an empty layer without measuring absent geometry.
   */
  abstract layerWidth(): number;
}
